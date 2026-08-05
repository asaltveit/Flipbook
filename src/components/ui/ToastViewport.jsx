import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'var(--crayon-green)',
  error: 'var(--crayon-red)',
  info: 'var(--crayon-blue)',
};

export default function ToastViewport({ toasts, onRemove }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 p-4 rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'var(--paper-surface)',
              border: 'var(--border-crayon-light)',
              boxShadow: 'var(--shadow-paper)',
              color: 'var(--text-primary)',
            }}
          >
            <Icon size={22} style={{ color: colors[toast.type], flexShrink: 0 }} aria-hidden="true" />
            <p className="flex-1 text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="ui-focus p-1 rounded-full"
              aria-label="Dismiss notification"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
