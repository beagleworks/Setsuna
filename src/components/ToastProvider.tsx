'use client';

import { ReactNode } from 'react';
import { ToastContext, useToastState } from '@/hooks/useToast';
import { Toast } from './Toast';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toastState = useToastState();

  return (
    <ToastContext.Provider value={toastState}>
      {children}
      {/* トーストコンテナ（画面右下に固定） */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-label="通知"
      >
        {toastState.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={toastState.removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
