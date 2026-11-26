import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, AlertCircle, ClipboardCheck } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { extractErrorMessage } from '../../services/api';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  SENTIMENT_TYPES,
  formatDateTime,
  formatScore,
} from '../../utils/formatters';
import {
  SentimentBadge,
  EmotionBadge,
  StatusBadge,
  PriorityBadge,
  InputMethodBadge,
} from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function AssignedComplaints() {
  const [searchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    sentiment: searchParams.get('sentiment') || '',
    category: '',
  });

  const loadAssigned = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await agentService.getMyComplaints(activeFilters);
      setComplaints(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load your assigned complaints.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssigned(filters);
  }, [loadAssigned, filters]);

  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      sentiment: '',
      category: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Assigned Complaints</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage, update status, and resolve complaints assigned to you.
          </p>
        </div>
        <Link
          to="/agent/available"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors self-start"
        >
          Claim More Tickets
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Search &amp; Filter Assigned Tickets
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-600"
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
              placeholder="Search customer, title, or #ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={handleFilterChange('status')}
            aria-label="Filter by status"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={handleFilterChange('priority')}
            aria-label="Filter by priority"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Priorities</option>
            {COMPLAINT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filters.sentiment}
            onChange={handleFilterChange('sentiment')}
            aria-label="Filter by sentiment"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
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
            aria-label="Filter by category"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading assigned complaints..." />
        ) : error ? (
          <div className="p-6 flex items-center gap-2.5 text-sm text-rose-700 bg-rose-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardCheck}
              title="No matching assigned complaints"
              description="Claim tickets from the Available Queue or clear your active filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Complaint &amp; Description</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Sentiment &amp; Score</th>
                  <th className="px-5 py-3">Emotion</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Priority</th>
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
                        to={`/agent/complaints/${c.id}`}
                        className="font-semibold text-sky-600 hover:underline block truncate"
                      >
                        {c.complaintTitle}
                      </Link>
                      <p className="text-xs text-slate-500">{c.complaintCategory}</p>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {c.complaintDescription}
                      </p>
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
                    <td className="px-5 py-4">
                      <PriorityBadge priority={c.priority} />
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
