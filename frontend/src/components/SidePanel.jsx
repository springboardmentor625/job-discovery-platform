import { X } from "lucide-react";

export default function SidePanel({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-60 right-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink leading-snug">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors shrink-0 mt-1"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}