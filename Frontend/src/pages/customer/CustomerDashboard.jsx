import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Keyboard, Clock, CheckCircle2, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { SentimentBadge, StatusBadge, InputMethodBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await complaintService.getMyComplaints();
        if (active) setComplaints(data);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load your complaints.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending' || c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const voiceCount = complaints.filter((c) => c.inputMethod === 'Voice').length;

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 p-7 sm:p-9 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Customer Support Workspace
            </p>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              Hello, {user?.fullName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-indigo-100 leading-relaxed">
              Need help? Speak directly through your microphone or type your complaint. Our system
              transcribes your voice, lets you review it, and routes it to support with real-time sentiment priority.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/customer/submit?mode=Voice"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <Mic className="h-4 w-4" />
              Speak Complaint
            </Link>
            <Link
              to="/customer/submit?mode=Text"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <Keyboard className="h-4 w-4" />
              Type Complaint
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Submitted
            </span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active / Open
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{pending}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{resolved}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Voice Tickets
            </span>
            <Mic className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{voiceCount}</p>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Your Recent Complaints</h2>
          <Link
            to="/customer/complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your complaint history..." />
        ) : error ? (
          <div className="p-6 flex items-center gap-2.5 text-sm text-rose-700 bg-rose-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No complaints submitted yet"
              description="Submit your first voice or text complaint and track its resolution status in real time."
              action={
                <Link
                  to="/customer/submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Submit a Complaint
                </Link>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/customer/complaints/${item.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{item.id}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {item.complaintTitle}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.complaintCategory} &bull; {formatDateTime(item.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <InputMethodBadge method={item.inputMethod} />
                  {item.sentimentAnalysis && (
                    <SentimentBadge sentiment={item.sentimentAnalysis.sentiment} />
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
