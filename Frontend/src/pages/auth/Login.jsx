import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Mail, Lock, ArrowRight, ShieldCheck, User, Headset } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../services/api';
import { getHomeRouteForRole } from '../../utils/formatters';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(getHomeRouteForRole(user.role), { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid email or password.');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Brand Panel */}
      <div className="lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">PulseDesk AI</span>
              <p className="text-xs text-slate-400">Helpdesk Sentiment Intelligence</p>
            </div>
          </div>

          <h1 className="mt-12 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Understand every customer voice in real time.
          </h1>
          <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-lg">
            Submit helpdesk complaints via browser voice recognition or text, and let our
            explainable NLP engine detect sentiment, customer emotion, and priority instantly.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Voice-to-Text
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Web Speech API transcription supporting English (en-IN) &amp; Hindi (hi-IN).
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Explainable NLP
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Classifies Positive, Negative, Neutral &amp; 6 emotional states with clear reasoning.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          ASP.NET Core Web API &bull; MySQL &bull; React &bull; Web Speech API
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Customer, Support Agent &amp; Administrator portal access
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Local Development Demo Quick-Fill */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Local Demo Accounts (Development Only)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('aarav.sharma@example.com', 'Customer@123')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('agent@pulsedesk.local', 'Agent@12345')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-colors"
                >
                  <Headset className="h-3.5 w-3.5" />
                  Agent
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin@pulsedesk.local', 'Admin@12345')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New customer?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
