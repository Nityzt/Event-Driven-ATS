import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 dark:hover:bg-brand-500 focus-visible:ring-brand-500 shadow-sm',
  secondary: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 focus-visible:ring-brand-500',
  outline:   'border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:ring-stone-400',
  ghost:     'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 focus-visible:ring-stone-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500 focus-visible:ring-red-500 shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-[background-color,transform] duration-150 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted',
        'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
