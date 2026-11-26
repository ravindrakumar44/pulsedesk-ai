import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, RotateCcw, Hand, AlertCircle, Inbox } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { extractErrorMessage } from '../../services/api';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  SENTIMENT_TYPES,
  formatDateTime,
  formatScore,
} from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  SentimentBadge,
  EmotionBadge,
  StatusBadge,
  PriorityBadge,
  InputMethodBadge,
} from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AvailableComplaints() {
  const toast = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimTarget, setClaimTarget] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    sentiment: '',
    category: '',
  });

  const loadAvailable = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await agentService.getAvailableComplaints(activeFilters);
      setComplaints(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load available complaint queue.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailable(filters);
  }, [loadAvailable, filters]);

  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', priority: '', sentiment: '', category: '' });
  };

  const handleConfirmClaim = async () => {
    if (!claimTarget) return;
    setClaiming(true);
    try {
      await agentService.claimComplaint(claimTarget.id);
      toast.success(`Complaint #${claimTarget.id} assigned to you!`);
      const claimedId = claimTarget.id;
      setClaimTarget(null);
      navigate(`/agent/complaints/${claimedId}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not claim this complaint.'));
      setClaimTarget(null);
      loadAvailable(filters);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Available Unassigned Queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review unassigned customer complaints sorted by priority and claim a ticket to handle its resolution.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filter Queue
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            value={filters.priority}
            onChange={handleFilterChange('priority')}
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

      {/* Queue List */}
      {loading ? (
        <LoadingSpinner label="Loading available complaints..." />
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No unassigned complaints available"
          description="All open customer complaints have been claimed, or none match your current filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:border-sky-200 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{c.id}</span>
                    <Link
                      to={`/agent/complaints/${c.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-sky-700 truncate"
                    >
                      {c.complaintTitle}
                    </Link>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>

                  <p className="text-xs text-slate-500">
                    {c.customerName} ({c.customerEmail}) &bull; {c.complaintCategory} &bull;{' '}
                    {formatDateTime(c.createdAt)}
                  </p>

                  <p className="text-sm text-slate-600 line-clamp-2">{c.complaintDescription}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <InputMethodBadge method={c.inputMethod} />
                    {c.sentimentAnalysis && (
                      <>
                        <SentimentBadge sentiment={c.sentimentAnalysis.sentiment} />
                        <EmotionBadge emotion={c.sentimentAnalysis.emotion} />
                        <span className="text-xs font-mono text-slate-600">
                          Score: {formatScore(c.sentimentAnalysis.sentimentScore)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to={`/agent/complaints/${c.id}`}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Inspect
                  </Link>
                  <button
                    type="button"
                    onClick={() => setClaimTarget(c)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
                  >
                    <Hand className="h-3.5 w-3.5" />
                    Claim Complaint
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(claimTarget)}
        title="Claim Customer Complaint"
        message={
          claimTarget
            ? `Claim Ticket #${claimTarget.id} ("${claimTarget.complaintTitle}")? Once claimed, only you can process and resolve this complaint.`
            : ''
        }
        confirmLabel="Yes, Claim Ticket"
        loading={claiming}
        onConfirm={handleConfirmClaim}
        onCancel={() => setClaimTarget(null)}
      />
    </div>
  );
}
