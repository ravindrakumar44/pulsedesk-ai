import { Smile, Frown, Meh, Mic, Keyboard, Flag } from 'lucide-react';

export function SentimentBadge({ sentiment }) {
  const map = {
    Positive: {
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: Smile,
    },
    Negative: {
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      Icon: Frown,
    },
    Neutral: {
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
      Icon: Meh,
    },
  };

  const config = map[sentiment] || map.Neutral;
  const { Icon, classes } = config;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {sentiment || 'Neutral'}
    </span>
  );
}

export function EmotionBadge({ emotion }) {
  const map = {
    Happy: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
    Satisfied: 'bg-teal-50 text-teal-700 border-teal-200',
    Angry: 'bg-red-100 text-red-800 border-red-200',
    Frustrated: 'bg-orange-100 text-orange-800 border-orange-200',
    Disappointed: 'bg-amber-100 text-amber-800 border-amber-200',
    Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        map[emotion] || map.Neutral
      }`}
    >
      {emotion || 'Neutral'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Closed: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        map[status] || map.Pending
      }`}
    >
      {status || 'Pending'}
    </span>
  );
}

export function InputMethodBadge({ method }) {
  const isVoice = method === 'Voice';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
        isVoice
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          : 'bg-slate-100 text-slate-700 border border-slate-200'
      }`}
    >
      {isVoice ? <Mic className="h-3 w-3" /> : <Keyboard className="h-3 w-3" />}
      {method || 'Text'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    High: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        map[priority] || map.Medium
      }`}
    >
      <Flag className="h-3 w-3" />
      {priority || 'Medium'}
    </span>
  );
}
