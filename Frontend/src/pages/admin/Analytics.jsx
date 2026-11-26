import { useEffect, useState } from 'react';
import { Mic, Keyboard, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
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
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import { formatScore } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const EMOTION_COLORS = ['#6366f1', '#f43f5e', '#f97316', '#eab308', '#10b981', '#64748b'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await adminService.getAnalytics();
        if (active) setData(res);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load analytics report.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Generating analytics report..." />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  const summary = data?.summary || {};
  const emotions = data?.emotionDistribution || [];
  const categories = data?.categoryBreakdown || [];
  const inputSplit = [
    { name: 'Voice Input', count: data?.voiceSubmissions ?? 0 },
    { name: 'Text Input', count: data?.textSubmissions ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics &amp; Sentiment Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Emotion telemetry, channel adoption (Voice vs Text), and resolution performance.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolution Rate
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data?.resolutionRatePercent ?? 0}%
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Heuristic Score
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold font-mono text-slate-900">
            {formatScore(summary.averageSentimentScore)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Voice Submissions
            </span>
            <Mic className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data?.voiceSubmissions ?? 0}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Text Submissions
            </span>
            <Keyboard className="h-4 w-4 text-slate-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data?.textSubmissions ?? 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Emotions Bar Chart */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Detected Customer Emotions</h2>
          <p className="text-xs text-slate-500 mb-4">
            Frequency of Happy, Satisfied, Angry, Frustrated, Disappointed, and Neutral
          </p>
          {emotions.length === 0 ? (
            <EmptyState title="No emotion records" description="Emotion distribution populates once tickets are analyzed." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotions} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="emotion" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]}>
                    {emotions.map((entry, idx) => (
                      <Cell key={entry.emotion} fill={EMOTION_COLORS[idx % EMOTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Voice vs Text Split */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Input Channel Adoption</h2>
          <p className="text-xs text-slate-500 mb-4">Voice (Web Speech API) vs Text Submissions</p>
          {(data?.voiceSubmissions ?? 0) + (data?.textSubmissions ?? 0) === 0 ? (
            <EmptyState title="No submissions yet" description="Channel metrics appear once complaints exist." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inputSplit}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#0ea5e9" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Category Sentiment Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Positive</th>
                <th className="px-6 py-3">Negative</th>
                <th className="px-6 py-3">Neutral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{cat.category}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">{cat.total}</td>
                  <td className="px-6 py-3.5 text-emerald-700 font-semibold">{cat.positive}</td>
                  <td className="px-6 py-3.5 text-rose-700 font-semibold">{cat.negative}</td>
                  <td className="px-6 py-3.5 text-slate-600 font-semibold">{cat.neutral}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
