import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = Math.random().toString(36).substring(7);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: Toast;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-green-900/90",
          border: "border-green-700",
          icon: "fa-check-circle",
          iconColor: "text-green-400",
        };
      case "error":
        return {
          bg: "bg-red-900/90",
          border: "border-red-700",
          icon: "fa-exclamation-circle",
          iconColor: "text-red-400",
        };
      case "warning":
        return {
          bg: "bg-yellow-900/90",
          border: "border-yellow-700",
          icon: "fa-exclamation-triangle",
          iconColor: "text-yellow-400",
        };
      default:
        return {
          bg: "bg-neutral-800/90",
          border: "border-neutral-600",
          icon: "fa-info-circle",
          iconColor: "text-neutral-400",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`${styles.bg} ${styles.border} border backdrop-blur-md rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-[slideIn_0.3s_ease-out] min-w-[300px]`}
    >
      <i className={`fas ${styles.icon} ${styles.iconColor} text-lg`}></i>
      <p className="text-white text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-neutral-400 hover:text-white transition-colors"
      >
        <i className="fas fa-times text-sm"></i>
      </button>
    </div>
  );
};
