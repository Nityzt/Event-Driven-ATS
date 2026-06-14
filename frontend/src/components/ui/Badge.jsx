import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-stone-100 text-stone-600 border border-stone-200',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-700 border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-200',
  purple:  'bg-purple-50 text-purple-700 border border-purple-200',
  brand:   'bg-brand-50 text-brand-700 border border-brand-200',
};

const dotColors = {
  default: 'bg-stone-400',
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
