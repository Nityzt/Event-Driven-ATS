import { useId } from 'react';
import { cn } from '../../lib/utils';

export default function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  className,
  inputClassName,
  ...rest
}) {
  const id = useId();
  const inputId = rest.id || id;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900',
            'placeholder:text-zinc-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'transition-colors duration-150',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-zinc-300',
            inputClassName,
          )}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-zinc-500">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
