import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquarePlus, AlertCircle } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { extractErrorMessage } from '../../services/api';
import { COMPLAINT_STATUSES, formatDateTime } from '../../utils/formatters';
import { SentimentBadge, EmotionBadge, StatusBadge, InputMethodBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await complaintService.getMyComplaints();
        if (active) setComplaints(data);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to fetch your complaints.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesStatus = !statusFilter || c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.complaintTitle.toLowerCase().includes(q) ||
        c.complaintCategory.toLowerCase().includes(q) ||
        String(c.id).includes(q.replace('#', ''));
      return matchesStatus && matchesSearch;
    });
  }, [complaints, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track resolution progress and review your submitted transcripts.
          </p>
        </div>
        <Link
          to="/customer/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors self-start"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Complaint
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by complaint ID, title, or category..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your complaints..." />
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching complaints"
          description={
            complaints.length === 0
              ? 'You have not submitted any complaints yet.'
              : 'Try clearing your search or status filter.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <Link
              key={item.id}
              to={`/customer/complaints/${item.id}`}
              className="block rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{item.id}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {item.complaintTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.complaintCategory} &bull; Submitted {formatDateTime(item.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.transcript}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <InputMethodBadge method={item.inputMethod} />
                  {item.sentimentAnalysis && (
                    <>
                      <SentimentBadge sentiment={item.sentimentAnalysis.sentiment} />
                      <EmotionBadge emotion={item.sentimentAnalysis.emotion} />
                    </>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
