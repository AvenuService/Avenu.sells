import { useEffect } from "react";
import { CloseIcon, TrashIcon } from "./Icons";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="confirm-overlay" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-backdrop" onClick={onCancel} />
      <div className="confirm-card card fade-up">
        <div className="confirm-head">
          <div className="confirm-icon">
            {danger ? <TrashIcon size={18} /> : <CloseIcon size={18} />}
          </div>
          <button className="confirm-close" onClick={onCancel} aria-label="Close"><CloseIcon size={18} /></button>
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p className="muted">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
