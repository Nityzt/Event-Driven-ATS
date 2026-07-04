import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800',
  success: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
  warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  danger:  'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
  info:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  purple:  'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  brand:   'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800',
};

const dotColors = {
  default: 'bg-stone-400 dark:bg-stone-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  purple:  'bg-purple-500',
  brand:   'bg-brand-500',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ variant = 'default', size = 'md', dot, children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      variants[variant],
      sizes[size],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function stageToBadgeVariant(stage) {
  const map = {
    Applied:   'info',
    Screening: 'warning',
    Interview: 'purple',
    Offer:     'brand',
    Hired:     'success',
    Rejected:  'danger',
  };
  return map[stage] || 'default';
}

export function stateToBadgeVariant(state) {
  const map = {
    queued:    'default',
    running:   'info',
    paused:    'warning',
    completed: 'success',
    failed:    'danger',
    cancelled: 'default',
  };
  return map[state] || 'default';
}
