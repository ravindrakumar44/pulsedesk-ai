import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateShort } from '../../utils/formatters';

export default function CustomerProfile() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Your registered PulseDesk AI account details.</p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 text-2xl font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
            <span className="inline-block mt-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">{user?.email}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {user?.phoneNumber || 'Not provided'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Account ID
            </div>
            <p className="mt-1.5 text-sm font-mono font-medium text-slate-900">#{user?.id}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              Member Since
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              {formatDateShort(user?.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
