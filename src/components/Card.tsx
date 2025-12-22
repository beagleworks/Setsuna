import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>}
      {children}
    </div>
  );
}
