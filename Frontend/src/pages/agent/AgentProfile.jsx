import { useEffect, useState } from 'react';
import { Mail, Phone, Shield, Calendar, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { extractErrorMessage } from '../../services/api';
import { formatDateShort } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AgentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await agentService.getProfile();
        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load agent profile.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading agent profile..." />;

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-2.5 text-sm text-rose-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error || 'Profile unavailable.'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your support agent account details and complaint resolution summary.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 text-2xl font-bold">
            {profile.fullName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
            <span className="inline-block mt-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {profile.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">{profile.email}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {profile.phoneNumber || 'Not provided'}
            </p>
          </div>

          <div className="rounded-2xl bg-sky-50/70 p-4 border border-sky-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
              <ClipboardList className="h-3.5 w-3.5" />
              Assigned Complaints
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {profile.assignedComplaintCount}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved Complaints
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">
              {profile.resolvedComplaintCount}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Agent ID
            </div>
            <p className="mt-1.5 text-sm font-mono font-medium text-slate-900">#{profile.id}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              Joined
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {formatDateShort(profile.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
