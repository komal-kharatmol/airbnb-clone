import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/* Generic centered modal (bottom sheet on mobile) */
export function Modal({ open, onClose, title, children, footer, size = 'max-w-[568px]' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`flex max-h-[92vh] w-full ${size} animate-pop flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}>
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-[#DDDDDD]">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 grid h-8 w-8 place-items-center rounded-full hover:bg-[#F7F7F7]">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-[#DDDDDD] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* Confirm dialog used for cancel / delete */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Keep', danger, busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="max-w-[460px]"
      footer={
        <div className="flex justify-between gap-3">
          <button onClick={onCancel} disabled={busy} className="rounded-lg px-4 py-3 font-semibold underline hover:bg-[#F7F7F7]">{cancelLabel}</button>
          <button onClick={onConfirm} disabled={busy}
            className={`flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white ${danger ? 'bg-[#C13515] hover:bg-[#a32c11]' : 'bg-[#222222] hover:bg-black'} disabled:opacity-60`}>
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {confirmLabel}
          </button>
        </div>
      }>
      <p className="text-base text-[#222222]">{message}</p>
    </Modal>
  );
}

/* Tiny toast: const [toast, show] = useToast();  render {toast}; call show('Saved') */
export function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div role="status" className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 animate-pop rounded-lg bg-[#222222] px-5 py-3 text-sm font-medium text-white shadow-xl">
      {msg}
    </div>
  ) : null;
  return [node, show];
}
