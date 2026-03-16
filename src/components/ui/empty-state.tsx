import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-12 text-gray-400', className)}>
      {Icon && <Icon className="h-8 w-8 text-gray-300" />}
      <span className="text-sm">{message}</span>
    </div>
  );
}
