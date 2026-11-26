import { useEffect } from "react";

// Glass dialog used for the booking form and the inquiries list.
export default function Dialog({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} className="dialog" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
