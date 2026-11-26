import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Loader,
  CheckCircle2,
  Flame,
  Inbox,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { agentService } from '../../services/agentService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime, formatScore } from '../../utils/formatters';
import {
  SentimentBadge,
  EmotionBadge,
  StatusBadge,
  PriorityBadge,
  InputMethodBadge,
} from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Negative: '#f43f5e',
  Neutral: '#64748b',
};

export default function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await agentService.getDashboard();
        if (active) setData(res);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load agent dashboard.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Loading agent workspace..." />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const statusBreakdown = data?.statusBreakdown || [];
  const sentimentDistribution = data?.sentimentDistribution || [];
  const highPriority = data?.highPriorityAssigned || [];
  const recentAssigned = data?.recentAssigned || [];

  const kpiCards = [
    {
      label: 'Total Assigned',
      value: kpis.totalAssignedComplaints ?? 0,
      icon: ClipboardList,
      accent: 'text-sky-600 bg-sky-50',
    },
    {
      label: 'Pending',
      value: kpis.pendingComplaints ?? 0,
      icon: Clock,
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'In Progress',
      value: kpis.inProgressComplaints ?? 0,
      icon: Loader,
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Resolved',
      value: kpis.resolvedComplaints ?? 0,
      icon: CheckCircle2,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'High-Priority',
      value: kpis.highPriorityComplaints ?? 0,
      icon: Flame,
      accent: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-slate-900 p-7 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">
              Support Agent Overview
            </p>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              Complaint Resolution Command
            </h1>
            <p className="mt-1.5 text-sm text-sky-100 max-w-xl">
              There are currently{' '}
              <span className="font-bold text-white">
                {kpis.availableUnassignedComplaints ?? 0}
              </span>{' '}
              unassigned customer complaints waiting to be claimed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/agent/available"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 transition-colors"
            >
              <Inbox className="h-4 w-4" />
              Claim Complaints ({kpis.availableUnassignedComplaints ?? 0})
            </Link>
            <Link
              to="/agent/complaints"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              My Assigned Queue
            </Link>
          </div>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">My Workload by Status</h2>
          <p className="text-xs text-slate-500 mb-4">
            Status distribution of complaints assigned to you
          </p>
          {kpis.totalAssignedComplaints === 0 ? (
            <EmptyState
              title="No assigned complaints yet"
              description="Claim an available complaint from the queue to populate your workload chart."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Complaints" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Assigned Sentiment Mix</h2>
          <p className="text-xs text-slate-500 mb-4">
            Sentiment breakdown across your assigned tickets
          </p>
          {kpis.totalAssignedComplaints === 0 ? (
            <EmptyState
              title="No sentiment telemetry yet"
              description="Charts update automatically when you claim complaints."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    dataKey="count"
                    nameKey="sentiment"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {sentimentDistribution.map((entry) => (
                      <Cell
                        key={entry.sentiment}
                        fill={SENTIMENT_COLORS[entry.sentiment] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} complaints`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* High-Priority Assigned Complaints */}
      <div className="rounded-2xl bg-white border border-rose-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50/70 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-600" />
            <div>
              <h2 className="text-base font-semibold text-rose-950">
                High-Priority Assigned Complaints
              </h2>
              <p className="text-xs text-rose-700">
                Open high-priority tickets assigned to you requiring prompt resolution
              </p>
            </div>
          </div>
          <Link
            to="/agent/complaints?priority=High"
            className="text-xs font-semibold text-rose-700 hover:text-rose-900"
          >
            View All High-Priority &rarr;
          </Link>
        </div>

        {highPriority.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No open high-priority complaints are currently assigned to you.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {highPriority.map((c) => (
              <Link
                key={c.id}
                to={`/agent/complaints/${c.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 hover:bg-rose-50/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">#{c.id}</span>
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {c.complaintTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.customerName} ({c.customerEmail}) &bull; {c.complaintCategory} &bull;{' '}
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <PriorityBadge priority={c.priority} />
                  {c.sentimentAnalysis && (
                    <>
                      <SentimentBadge sentiment={c.sentimentAnalysis.sentiment} />
                      <EmotionBadge emotion={c.sentimentAnalysis.emotion} />
                      <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-mono font-semibold text-rose-700">
                        {formatScore(c.sentimentAnalysis.sentimentScore)}
                      </span>
                    </>
                  )}
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assigned Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recently Updated Assigned Tickets</h2>
          <Link
            to="/agent/complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            Open My Assigned <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentAssigned.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No assigned complaints yet"
              description="Visit the Available Queue to accept and resolve customer complaints."
              action={
                <Link
                  to="/agent/available"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Browse Available Queue
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Complaint</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Sentiment</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAssigned.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{c.id}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-900">{c.customerName}</p>
                      <p className="text-xs text-slate-500">{c.customerEmail}</p>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <Link
                        to={`/agent/complaints/${c.id}`}
                        className="font-semibold text-sky-600 hover:underline block truncate"
                      >
                        {c.complaintTitle}
                      </Link>
                      <span className="text-xs text-slate-500">{c.complaintCategory}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <InputMethodBadge method={c.inputMethod} />
                    </td>
                    <td className="px-6 py-3.5">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-6 py-3.5">
                      <SentimentBadge sentiment={c.sentimentAnalysis?.sentiment} />
                    </td>
                    <td className="px-6 py-3.5">
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
