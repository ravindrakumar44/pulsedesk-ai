import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Sparkles, Clock, AlertCircle, Headset, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime, formatScore } from '../../utils/formatters';
import {
  SentimentBadge,
  EmotionBadge,
  StatusBadge,
  InputMethodBadge,
  PriorityBadge,
} from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminComplaintDetails() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await adminService.getComplaintById(id);
        if (active) setComplaint(data);
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

  if (loading) return <LoadingSpinner label="Loading ticket inspection view..." />;

  if (error || !complaint) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Complaints
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error || 'Complaint not found.'}
        </div>
      </div>
    );
  }

  const sa = complaint.sentimentAnalysis;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/admin/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Complaints
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Main Detail Column */}
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
                Complete Customer Transcript
              </h2>
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {complaint.transcript}
              </div>
            </div>

            {sa && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  NLP Sentiment Analysis Breakdown
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <SentimentBadge sentiment={sa.sentiment} />
                  <EmotionBadge emotion={sa.emotion} />
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-mono font-semibold text-slate-700">
                    Sentiment Score: {formatScore(sa.sentimentScore)}
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs text-slate-600">
                    {sa.isCalibratedProbability
                      ? `Calibrated Confidence: ${(sa.confidenceScore * 100).toFixed(1)}%`
                      : 'Heuristic Lexicon Score (Un-calibrated)'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{sa.explanation}</p>
              </div>
            )}

            {complaint.resolutionMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolution Summary
                </div>
                <p className="text-sm text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  {complaint.resolutionMessage}
                </p>
                {complaint.resolvedAt && (
                  <p className="text-xs text-emerald-700">
                    Resolved at: {formatDateTime(complaint.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Created: {formatDateTime(complaint.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Updated: {formatDateTime(complaint.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Customer Info & Read-Only Assignment Summary */}
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

          <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Assignment &amp; Status
            </h2>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Headset className="h-4 w-4 text-slate-400" />
              <span>
                {complaint.assignedAgentName
                  ? `Assigned to ${complaint.assignedAgentName}`
                  : 'Unassigned (In Agent Queue)'}
              </span>
            </div>
            <div className="pt-1">
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-xs text-slate-500">
              Status updates and complaint resolutions are managed exclusively by Support Agents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
