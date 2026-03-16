'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  /** Render inside a relative container instead of full-screen */
  inline?: boolean;
}

export function LoadingOverlay({ isLoading, message = 'Carregando...', className, inline = false }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isLoading) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setShouldRender(false), 300);
      }, 10000);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-300 pointer-events-none',
        inline
          ? 'absolute inset-0 z-10'
          : 'fixed inset-0 z-[9999]',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <div className={cn(
        'absolute inset-0',
        inline ? 'bg-white/90 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-md',
      )} />

      <div className={cn(
        'relative flex flex-col items-center transition-all duration-500',
        visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
      )}>
        <div className="relative">
          <div className={cn(
            'absolute rounded-full border-2 border-accent/30 animate-[loading-ring-pulse_2s_ease-in-out_infinite]',
            inline ? '-inset-3' : '-inset-4',
          )} />
          <div className={cn(
            'absolute rounded-full border border-accent/20 animate-[loading-ring-pulse_2s_ease-in-out_infinite_0.5s]',
            inline ? '-inset-6' : '-inset-8',
          )} />

          <div className={cn(
            'relative rounded-2xl overflow-hidden animate-[loading-logo-breathe_2s_ease-in-out_infinite] shadow-lg shadow-accent/10',
            inline ? 'w-12 h-12' : 'w-20 h-20',
          )}>
            <Image
              src="/favicon.png"
              alt="Previsão Presilhas"
              width={inline ? 48 : 80}
              height={inline ? 48 : 80}
              className="w-full h-full object-contain p-2 bg-white"
              priority
            />
          </div>
        </div>

        <div className={cn('flex items-center gap-1.5', inline ? 'mt-5' : 'mt-8')}>
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-[loading-dot-bounce_1.4s_ease-in-out_infinite]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-[loading-dot-bounce_1.4s_ease-in-out_0.2s_infinite]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-[loading-dot-bounce_1.4s_ease-in-out_0.4s_infinite]" />
        </div>

        {message && (
          <p className={cn(
            'font-medium text-gray-500 animate-[loading-fade-in_0.6s_ease-out_0.3s_both]',
            inline ? 'mt-2 text-xs' : 'mt-4 text-sm',
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
