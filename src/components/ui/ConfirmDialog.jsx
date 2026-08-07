import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll(FOCUSABLE);
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    first?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
        return;
      }
      if (e.key !== 'Tab' || !focusables?.length) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md p-6 rounded-xl bg-gray-800 border border-gray-600 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold mb-2 text-white">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="mb-6 text-base text-gray-200">
          {message}
        </p>
        <div className="flex gap-3 justify-end flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="a11y-btn a11y-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="a11y-btn a11y-btn-danger"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
