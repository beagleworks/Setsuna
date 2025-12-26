import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-neutral-900 border-2 border-white p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b-2 border-white">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
