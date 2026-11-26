import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import {
  COMPLAINT_CATEGORIES,
  SENTIMENT_TYPES,
  formatDateTime,
  formatScore,
} from '../../utils/formatters';
import { SentimentBadge, EmotionBadge, StatusBadge, InputMethodBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function AllComplaints() {
  const [searchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    sentiment: searchParams.get('sentiment') || '',
    category: '',
    status: '',
    fromDate: '',
    toDate: '',
  });

  const fetchComplaints = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAllComplaints(activeFilters);
      setComplaints(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load complaints list.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(filters);
  }, [fetchComplaints, filters]);

  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      sentiment: '',
      category: '',
      status: '',
      fromDate: '',
      toDate: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Customer Complaints</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor complaints, sentiment analysis results, and agent resolution progress.
        </p>
      </div>

      {/* Filters Panel */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Search &amp; Filter
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={handleFilterChange('search')}
              placeholder="Search customer name or #ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={filters.sentiment}
            onChange={handleFilterChange('sentiment')}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Sentiments</option>
            {SENTIMENT_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={handleFilterChange('category')}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={handleFilterChange('fromDate')}
            aria-label="From date"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={handleFilterChange('toDate')}
            aria-label="To date"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Results Table (Read-Only Status) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Fetching complaints..." />
        ) : error ? (
          <div className="p-6 flex items-center gap-2.5 text-sm text-rose-700 bg-rose-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No complaints match your filters"
              description="Try adjusting your date range, sentiment filter, or search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Title &amp; Category</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Sentiment &amp; Score</th>
                  <th className="px-5 py-3">Emotion</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Assigned Agent</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">#{c.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{c.customerName}</p>
                      <p className="text-xs text-slate-500">{c.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="font-semibold text-indigo-600 hover:underline block truncate"
                      >
                        {c.complaintTitle}
                      </Link>
                      <span className="text-xs text-slate-500">{c.complaintCategory}</span>
                    </td>
                    <td className="px-5 py-4">
                      <InputMethodBadge method={c.inputMethod} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <SentimentBadge sentiment={c.sentimentAnalysis?.sentiment} />
                        <span className="text-xs font-mono text-slate-600">
                          {formatScore(c.sentimentAnalysis?.sentimentScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <EmotionBadge emotion={c.sentimentAnalysis?.emotion} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {c.assignedAgentName || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
