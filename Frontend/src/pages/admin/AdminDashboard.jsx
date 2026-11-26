import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Headset,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import { formatDateTime, formatScore } from '../../utils/formatters';
import { SentimentBadge, EmotionBadge, StatusBadge, InputMethodBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Negative: '#f43f5e',
  Neutral: '#64748b',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await adminService.getDashboard();
        if (active) setData(res);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load admin dashboard metrics.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Loading real-time dashboard analytics..." />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const distribution = data?.sentimentDistribution || [];
  const byCategory = data?.complaintsByCategory || [];
  const trends = data?.sentimentTrends || [];
  const recent = data?.recentComplaints || [];
  const attention = data?.negativeAttentionComplaints || [];

  const kpiCards = [
    {
      label: 'Total Customers',
      value: kpis.totalCustomers ?? 0,
      icon: Users,
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Total Complaints',
      value: kpis.totalComplaints ?? 0,
      icon: MessageSquare,
      accent: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Positive Sentiments',
      value: kpis.positiveSentiments ?? 0,
      icon: Smile,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Negative Sentiments',
      value: kpis.negativeSentiments ?? 0,
      icon: Frown,
      accent: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Neutral Sentiments',
      value: kpis.neutralSentiments ?? 0,
      icon: Meh,
      accent: 'text-slate-600 bg-slate-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Helpdesk Sentiment Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live database metrics across customer voice and text submissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/agents"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          >
            <Headset className="h-4 w-4 text-emerald-600" />
            Registered Agents:{' '}
            <span className="font-mono font-bold text-slate-900">
              {kpis.totalAgents ?? 0}
            </span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600">
            Avg Sentiment Score:{' '}
            <span className="font-mono font-bold text-slate-900">
              {formatScore(kpis.averageSentimentScore)}
            </span>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Sentiment Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Share of Positive, Negative &amp; Neutral</p>
          {kpis.totalComplaints === 0 ? (
            <EmptyState title="No data yet" description="Charts populate once complaints are submitted." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="sentiment"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {distribution.map((entry) => (
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

        {/* Bar Chart by Category */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Complaints by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of Positive, Negative &amp; Neutral per category</p>
          {kpis.totalComplaints === 0 ? (
            <EmptyState title="No category data" description="No complaints recorded yet." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 12)}…` : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#64748b" />
                  <Bar dataKey="negative" name="Negative" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Line Chart: Sentiment Trends Over Time */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900">Sentiment Trends Over Time</h2>
        <p className="text-xs text-slate-500 mb-4">Daily volume of Positive, Negative, and Neutral complaints</p>
        {trends.length === 0 ? (
          <EmptyState title="No timeline data yet" description="Trend lines appear as complaints arrive over time." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 20, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="negative" name="Negative" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Negative Complaints Requiring Attention */}
      <div className="rounded-2xl bg-white border border-rose-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50/70 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <h2 className="text-base font-semibold text-rose-950">
                Negative Complaints Requiring Attention
              </h2>
              <p className="text-xs text-rose-700">
                Unresolved complaints flagged with negative sentiment, sorted by severity
              </p>
            </div>
          </div>
          <Link
            to="/admin/complaints?sentiment=Negative"
            className="text-xs font-semibold text-rose-700 hover:text-rose-900"
          >
            View All Negative &rarr;
          </Link>
        </div>

        {attention.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No open negative complaints currently require escalation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attention.map((c) => (
              <Link
                key={c.id}
                to={`/admin/complaints/${c.id}`}
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
                  {c.sentimentAnalysis && (
                    <>
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

      {/* Recent Complaints Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Complaints</h2>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open Full Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No complaints yet" description="Submitted customer complaints will appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Complaint</th>
                  <th className="px-6 py-3">Input</th>
                  <th className="px-6 py-3">Sentiment</th>
                  <th className="px-6 py-3">Emotion</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{c.id}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-900">{c.customerName}</p>
                      <p className="text-xs text-slate-500">{c.customerEmail}</p>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="font-semibold text-indigo-600 hover:underline block truncate"
                      >
                        {c.complaintTitle}
                      </Link>
                      <span className="text-xs text-slate-500">{c.complaintCategory}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <InputMethodBadge method={c.inputMethod} />
                    </td>
                    <td className="px-6 py-3.5">
                      <SentimentBadge sentiment={c.sentimentAnalysis?.sentiment} />
                    </td>
                    <td className="px-6 py-3.5">
                      <EmotionBadge emotion={c.sentimentAnalysis?.emotion} />
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
