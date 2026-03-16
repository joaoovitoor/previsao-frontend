import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ icon: Icon, iconColor = 'bg-accent', value, label, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded shadow-sm border border-gray-200 p-5', className)}>
      <div className="flex items-center gap-4">
        <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', iconColor)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
