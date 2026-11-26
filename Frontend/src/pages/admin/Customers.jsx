import { useEffect, useMemo, useState } from 'react';
import { Search, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import { formatDateShort } from '../../utils/formatters';
import { SentimentBadge } from '../../components/SentimentBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await adminService.getCustomers();
        if (active) setCustomers(data);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load customers.'));
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
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q))
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Customers</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor customer accounts, complaint volume, and sentiment history.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading customer directory..." />
        ) : error ? (
          <div className="p-6 flex items-center gap-2.5 text-sm text-rose-700 bg-rose-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={UsersIcon}
              title="No customers found"
              description="Registered customer accounts will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Complaints</th>
                  <th className="px-6 py-3">Sentiment Split (Pos / Neg / Neu)</th>
                  <th className="px-6 py-3">Latest Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{cust.fullName}</p>
                      <p className="text-xs text-slate-500">{cust.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cust.phoneNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateShort(cust.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {cust.totalComplaints}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="text-emerald-700 font-semibold">{cust.positiveCount}</span>
                      {' / '}
                      <span className="text-rose-700 font-semibold">{cust.negativeCount}</span>
                      {' / '}
                      <span className="text-slate-600 font-semibold">{cust.neutralCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      {cust.latestSentiment === 'N/A' ? (
                        <span className="text-xs text-slate-400">No complaints</span>
                      ) : (
                        <SentimentBadge sentiment={cust.latestSentiment} />
                      )}
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
