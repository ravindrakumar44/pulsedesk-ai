import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Headphones, Headset, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../services/api';
import { getHomeRouteForRole } from '../../utils/formatters';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'agent' ? 'Agent' : 'Customer';

  const { register, registerAgent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState(initialRole);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      };
      const user =
        accountType === 'Agent'
          ? await registerAgent(payload)
          : await register(payload);

      toast.success(
        `${accountType === 'Agent' ? 'Agent' : 'Customer'} account created! Welcome, ${user.fullName}.`
      );
      navigate(getHomeRouteForRole(user.role), { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Registration failed. Please check your details.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isAgent = accountType === 'Agent';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Headphones className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">PulseDesk AI</span>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80">
          <h1 className="text-2xl font-bold text-slate-900">
            Create {isAgent ? 'support agent' : 'customer'} account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAgent
              ? 'Register to claim and resolve customer support complaints'
              : 'Submit voice or text complaints and track resolution status'}
          </p>

          {/* Role Toggle: Customer vs Support Agent */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAccountType('Customer')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                !isAgent
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setAccountType('Agent')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                isAgent
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headset className="h-3.5 w-3.5" />
              Support Agent
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder={isAgent ? 'Vikram Rao' : 'Aarav Sharma'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder={isAgent ? 'agent@example.com' : 'aarav@example.com'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  placeholder="+91-9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Min 6 chars"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    placeholder="Repeat"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
                isAgent
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {submitting
                ? 'Creating Account...'
                : `Create ${isAgent ? 'Agent' : 'Customer'} Account`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
