import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Sparkles,
  Clock,
  AlertCircle,
  Hand,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { agentService } from '../../services/agentService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime, formatScore } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  SentimentBadge,
  EmotionBadge,
  StatusBadge,
  PriorityBadge,
  InputMethodBadge,
} from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AgentComplaintDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resolutionMessage, setResolutionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [confirmClaimOpen, setConfirmClaimOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await agentService.getComplaintById(id);
        if (active) {
          setComplaint(data);
          setResolutionMessage(data.resolutionMessage || '');
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Could not load complaint details.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleClaim = async () => {
    setActionLoading(true);
    try {
      const updated = await agentService.claimComplaint(complaint.id);
      setComplaint(updated);
      setConfirmClaimOpen(false);
      toast.success(`Ticket #${complaint.id} is now assigned to you.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not claim this complaint.'));
      setConfirmClaimOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const updated = await agentService.updateStatus(complaint.id, newStatus);
      setComplaint(updated);
      toast.success(`Ticket #${complaint.id} moved to ${newStatus}.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update complaint status.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResolveConfirm = (e) => {
    e.preventDefault();
    if (resolutionMessage.trim().length < 5) {
      toast.error('Please enter a resolution message (at least 5 characters) before resolving.');
      return;
    }
    setConfirmResolveOpen(true);
  };

  const handleConfirmResolve = async () => {
    setActionLoading(true);
    try {
      const resolved = await agentService.resolveComplaint(complaint.id, resolutionMessage.trim());
      setComplaint(resolved);
      setConfirmResolveOpen(false);
      toast.success(`Ticket #${complaint.id} marked as Resolved.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to resolve complaint.'));
      setConfirmResolveOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading complaint details..." />;

  if (error || !complaint) {
    return (
      <div className="space-y-4">
        <Link
          to="/agent/complaints"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Assigned
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error || 'Complaint not found.'}
        </div>
      </div>
    );
  }

  const sa = complaint.sentimentAnalysis;
  const isUnassigned = !complaint.assignedAgentId;
  const isAssignedToMe = complaint.assignedAgentId === user?.id;
  const isResolvedOrClosed =
    complaint.status === 'Resolved' || complaint.status === 'Closed';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={isUnassigned ? '/agent/available' : '/agent/complaints'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {isUnassigned ? 'Back to Available Queue' : 'Back to My Assigned'}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    Ticket #{complaint.id}
                  </span>
                  <InputMethodBadge method={complaint.inputMethod} />
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <h1 className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900">
                  {complaint.complaintTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{complaint.complaintCategory}</p>
              </div>
              <StatusBadge status={complaint.status} />
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Full Complaint Description
              </h2>
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {complaint.complaintDescription}
              </div>
            </div>

            {complaint.inputMethod === 'Voice' && complaint.transcript && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Original Voice Transcript
                </h2>
                <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {complaint.transcript}
                </div>
              </div>
            )}

            {sa && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  NLP Sentiment Analysis
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <SentimentBadge sentiment={sa.sentiment} />
                  <EmotionBadge emotion={sa.emotion} />
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-mono font-semibold text-slate-700">
                    Sentiment Score: {formatScore(sa.sentimentScore)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{sa.explanation}</p>
              </div>
            )}

            {isResolvedOrClosed && complaint.resolutionMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolution Logged
                </div>
                <p className="text-sm text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  {complaint.resolutionMessage}
                </p>
                {complaint.resolvedAt && (
                  <p className="text-xs text-emerald-700">
                    Resolved on {formatDateTime(complaint.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Submitted: {formatDateTime(complaint.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Updated: {formatDateTime(complaint.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Agent Resolution Workflow */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Customer Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-800">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-semibold">{complaint.customerName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{complaint.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{complaint.customerPhone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {isUnassigned && (
            <div className="rounded-3xl bg-white p-6 border border-sky-200 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-700">
                Unassigned Ticket
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Claim this complaint to assign it to yourself and begin processing its resolution.
              </p>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmClaimOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                <Hand className="h-4 w-4" />
                Claim Complaint
              </button>
            </div>
          )}

          {isAssignedToMe && (
            <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Resolution Workflow
              </h2>

              {complaint.status === 'Pending' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('In Progress')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4" />
                  Move to In Progress
                </button>
              )}

              {!isResolvedOrClosed && (
                <form onSubmit={handleOpenResolveConfirm} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Resolution Message (Required)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={resolutionMessage}
                      onChange={(e) => setResolutionMessage(e.target.value)}
                      placeholder="Describe the steps taken and how the customer's issue was resolved..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Resolved
                  </button>
                </form>
              )}

              {complaint.status === 'Resolved' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('Closed')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Close Resolved Ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmClaimOpen}
        title="Confirm Claim"
        message={`Assign Ticket #${complaint.id} to your queue? Other agents will no longer be able to claim it.`}
        confirmLabel="Claim Complaint"
        loading={actionLoading}
        onConfirm={handleClaim}
        onCancel={() => setConfirmClaimOpen(false)}
      />

      <ConfirmDialog
        open={confirmResolveOpen}
        title="Confirm Complaint Resolution"
        message={`Mark Ticket #${complaint.id} as Resolved with this resolution message? The customer will see the updated status and resolution message immediately.`}
        confirmLabel="Confirm & Resolve"
        loading={actionLoading}
        onConfirm={handleConfirmResolve}
        onCancel={() => setConfirmResolveOpen(false)}
      />
    </div>
  );
}
