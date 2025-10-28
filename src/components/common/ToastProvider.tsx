
'use client';

import React, { useEffect } from 'react';
import { useToastStore } from '@/lib/store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from '@/components/icons/Icons';

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastProps {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ id, title, description, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-400" />,
    error: <XCircle className="h-6 w-6 text-red-400" />,
    info: <Info className="h-6 w-6 text-cyan-400" />,
  };
  
  const colors = {
      success: 'border-green-500/50',
      error: 'border-red-500/50',
      info: 'border-cyan-500/50'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`mb-4 p-4 w-full rounded-lg shadow-lg glassmorphism border-l-4 ${colors[type]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-50">{title}</p>
          {description && <p className="mt-1 text-sm text-gray-300">{description}</p>}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onDismiss} className="inline-flex text-gray-400 hover:text-gray-200">
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

