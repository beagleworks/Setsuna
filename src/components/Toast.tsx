'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast as ToastType, ToastType as ToastVariant } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ICONS: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]',
  error: 'border-[#ff3366] bg-[#ff3366]/10 text-[#ff3366]',
  info: 'border-white bg-white/10 text-white',
  warning: 'border-[#ffff00] bg-[#ffff00]/10 text-[#ffff00]',
};

export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = ICONS[toast.type];

  useEffect(() => {
    // 表示アニメーション
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // 自動削除タイマー
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  return (
    <div
      className={`
        border-2 p-4 font-mono uppercase tracking-wider
        flex items-start gap-3
        transition-all duration-200 ease-out
        ${STYLES[toast.type]}
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1 text-sm leading-tight">{toast.message}</span>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
