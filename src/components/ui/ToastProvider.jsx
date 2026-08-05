import { ToastContext, useToastState } from '../../hooks/useToast';
import ToastViewport from '../ui/ToastViewport';

export function ToastProvider({ children }) {
  const { toasts, addToast, removeToast } = useToastState();

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
