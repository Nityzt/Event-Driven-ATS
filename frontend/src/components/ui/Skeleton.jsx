import { cn } from '../../lib/utils';

export default function Skeleton({ variant = 'rect', width, height, lines = 1, className }) {
  const base = 'skeleton-shimmer rounded';

  if (variant === 'circle') {
    return (
      <span
        className={cn(base, 'rounded-full block', className)}
        style={{ width: width || '2rem', height: height || '2rem' }}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={cn(base, 'block h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
            style={{ width: width, height: height || '1rem' }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={cn(base, 'block', className)}
      style={{ width: width || '100%', height: height || '1rem' }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="rect" className="h-4 w-24" />
            <Skeleton variant="circle" className="w-10 h-10" />
          </div>
          <Skeleton variant="rect" className="h-8 w-16 mb-2" />
          <Skeleton variant="rect" className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Skeleton variant="rect" className="h-5 w-48 mb-2" />
              <Skeleton variant="rect" className="h-3 w-32" />
            </div>
            <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton variant="text" lines={2} className="mb-3" />
          <div className="flex gap-2">
            <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
            <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
            <Skeleton variant="rect" className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CandidateCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="flex-1">
              <Skeleton variant="rect" className="h-4 w-32 mb-1" />
              <Skeleton variant="rect" className="h-3 w-40" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
            <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
            <Skeleton variant="rect" className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4"><Skeleton variant="rect" className="h-4 w-32" /></td>
          <td className="px-6 py-4"><Skeleton variant="rect" className="h-4 w-40" /></td>
          <td className="px-6 py-4"><Skeleton variant="rect" className="h-6 w-20 rounded-full" /></td>
          <td className="px-6 py-4"><Skeleton variant="rect" className="h-4 w-24" /></td>
          <td className="px-6 py-4"><Skeleton variant="rect" className="h-4 w-16" /></td>
        </tr>
      ))}
    </>
  );
}
