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
        'bg-white rounded-xl border border-zinc-200 shadow-card',
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
