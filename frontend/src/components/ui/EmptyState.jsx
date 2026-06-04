import { cn } from '../../lib/utils';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-zinc-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-sm mb-5">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
