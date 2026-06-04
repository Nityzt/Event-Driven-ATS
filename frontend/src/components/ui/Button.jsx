import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 shadow-sm',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500',
  outline:   'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-400',
  ghost:     'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
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
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
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
