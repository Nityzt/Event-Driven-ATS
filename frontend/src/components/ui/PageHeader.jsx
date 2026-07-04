import { cn } from '../../lib/utils';

export default function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[1.7rem] font-semibold text-stone-900 dark:text-stone-100 tracking-tightest leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap flex-shrink-0">{actions}</div>}
    </div>
  );
}
