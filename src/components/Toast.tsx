import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = `${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 border-slate-800 text-slate-100';
          let Icon = Info;
          let iconColor = 'text-blue-400';
          let progressBg = 'bg-blue-500';

          if (toast.type === 'success') {
            bgClass = 'bg-slate-900 border-emerald-900/50 text-slate-100';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
            progressBg = 'bg-emerald-500';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-slate-900 border-amber-900/50 text-slate-100';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
            progressBg = 'bg-amber-500';
          } else if (toast.type === 'error') {
            bgClass = 'bg-slate-900 border-rose-950 text-slate-100';
            Icon = XCircle;
            iconColor = 'text-rose-500';
            progressBg = 'bg-rose-500';
          }

          return (
            <div
              key={toast.id}
              className={`flex flex-col relative overflow-hidden p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in duration-300 ${bgClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
                  <p className="text-sm font-medium">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div 
                className={`absolute bottom-0 left-0 h-1 ${progressBg}`}
                style={{
                  animation: `shrinkWidth ${toast.duration || 4000}ms linear forwards`
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Dynamic styles for progress and animations */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slideIn {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
