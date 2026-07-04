import { cn } from '../../lib/utils';

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export default function Card({ as: Tag = 'div', padding = 'md', hover, className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
        paddings[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
