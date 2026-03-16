import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizes = {
  sm: 'h-5 w-5 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
};

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn(sizes[size], 'border-gray-300 border-t-gray-600 rounded-full animate-spin')} />
      {label && <span className="text-sm text-gray-400">{label}</span>}
    </div>
  );
}
