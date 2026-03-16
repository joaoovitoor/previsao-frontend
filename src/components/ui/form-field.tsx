import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, hint, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-xs text-gray-400 ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
}

export function FormRow({ children, cols = 2, className }: FormRowProps) {
  return (
    <div className={cn(cols === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
}
