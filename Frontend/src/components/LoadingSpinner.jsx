import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', label }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-9 w-9',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-6">
      <Loader2 className={`animate-spin text-indigo-600 ${sizes[size] || sizes.md}`} />
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  );
}
