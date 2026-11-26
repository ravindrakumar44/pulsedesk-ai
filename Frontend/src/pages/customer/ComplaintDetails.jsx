import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime, formatScore } from '../../utils/formatters';
import { SentimentBadge, EmotionBadge, StatusBadge, InputMethodBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await complaintService.getComplaintById(id);
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

  if (loading) return <LoadingSpinner label="Loading complaint details..." />;

  if (error || !complaint) {
    return (
      <div className="space-y-4">
        <Link
          to="/customer/complaints"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/customer/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Complaints
      </Link>

      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-semibold text-slate-400">
                Ticket #{complaint.id}
              </span>
              <InputMethodBadge method={complaint.inputMethod} />
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-slate-900">
              {complaint.complaintTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{complaint.complaintCategory}</p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Submitted Transcript / Description
          </h2>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {complaint.transcript}
          </div>
        </div>

        {sa && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Sentiment &amp; Emotion Analysis
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <SentimentBadge sentiment={sa.sentiment} />
              <EmotionBadge emotion={sa.emotion} />
              <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-mono font-semibold text-slate-700">
                Score: {formatScore(sa.sentimentScore)} ({sa.scoreType})
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{sa.explanation}</p>
          </div>
        )}

        {complaint.resolutionMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Support Resolution
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
            Last Updated: {formatDateTime(complaint.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
