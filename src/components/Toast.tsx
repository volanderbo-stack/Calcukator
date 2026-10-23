import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, toast.action ? 7000 : 2500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="toast-region" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" className="toast-action" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
