import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Select({
  label,
  hint,
  error,
  className,
  selectClassName,
  children,
  ...rest
}) {
  const id = useId();
  const selectId = rest.id || id;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-zinc-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'transition-colors duration-150',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-zinc-300',
            selectClassName,
          )}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>
      {hint && !error && (
        <p id={`${selectId}-hint`} className="text-xs text-zinc-500">{hint}</p>
      )}
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
