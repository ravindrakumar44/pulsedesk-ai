export const COMPLAINT_CATEGORIES = [
  'Internet / Network Issues',
  'Payment Issues',
  'Product Issues',
  'Technical Support',
  'Account Issues',
  'Other',
];

export const COMPLAINT_STATUSES = [
  'Pending',
  'In Progress',
  'Resolved',
  'Closed',
];

export const SENTIMENT_TYPES = ['Positive', 'Negative', 'Neutral'];

export const COMPLAINT_PRIORITIES = ['High', 'Medium', 'Low'];

export function getHomeRouteForRole(role) {
  if (role === 'Admin') return '/admin';
  if (role === 'Agent') return '/agent';
  return '/customer';
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDateShort(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return '0.00';
  const num = Number(score);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}`;
}
