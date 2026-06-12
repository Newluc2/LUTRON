import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-lutron-border bg-lutron-card ${className}`}>
      {children}
    </div>
  );
}
