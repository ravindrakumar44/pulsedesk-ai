import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Headset, UserPlus, X, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';
import { formatDateShort, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function Agents() {
  const toast = useToast();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAgents();
      setAgents(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load registered agents.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phoneNumber && a.phoneNumber.toLowerCase().includes(q))
    );
  }, [agents, search]);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await adminService.createAgent({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });
      toast.success(`Agent "${created.fullName}" registered successfully.`);
      setModalOpen(false);
      setForm({ fullName: '', email: '', phoneNumber: '', password: '' });
      loadAgents();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to create agent account.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Support Agents</h1>
          <p className="mt-1 text-sm text-slate-600">
            View all registered support agents, their assigned workload, and resolution performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Agent
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading registered support agents..." />
        ) : error ? (
          <div className="p-6 flex items-center gap-2.5 text-sm text-rose-700 bg-rose-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Headset}
              title="No support agents found"
              description="Agents who register or are added by an administrator will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3">Assigned</th>
                  <th className="px-6 py-3">Pending / In Progress / Resolved</th>
                  <th className="px-6 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{ag.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{ag.fullName}</p>
                      <p className="text-xs text-slate-500">{ag.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{ag.phoneNumber || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateShort(ag.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {ag.totalAssigned}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="text-amber-700 font-semibold">{ag.pendingCount}</span>
                      {' / '}
                      <span className="text-blue-700 font-semibold">{ag.inProgressCount}</span>
                      {' / '}
                      <span className="text-emerald-700 font-semibold">{ag.resolvedCount}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {ag.lastActivityAt ? formatDateTime(ag.lastActivityAt) : 'No activity yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Register Support Agent</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Vikram Rao"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="agent@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  placeholder="+91-9800000105"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? 'Registering...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
