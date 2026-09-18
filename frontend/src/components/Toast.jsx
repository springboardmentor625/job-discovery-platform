import { useEffect, useRef } from "react";

function Toast({ message, type = "success", onClose }) {
  // onClose is a fresh inline function on every parent render. Depending
  // on it directly used to mean any unrelated parent re-render while a
  // toast was showing would tear down and restart this 4-second timer —
  // a toast could linger indefinitely on a page that re-renders often.
  // Keeping the latest onClose in a ref lets the effect depend on
  // `message` alone.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  if (!message) {
    return null;
  }

  const icon = type === "success" ? "✓" : type === "error" ? "!" : "✦";

  const iconClasses =
    type === "success"
      ? "bg-emerald-500/20 text-emerald-400"
      : type === "error"
      ? "bg-red-500/20 text-red-400"
      : "bg-sx-primary-light/20 text-sx-primary-light";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 top-6 z-[9999] flex min-w-[300px] max-w-[420px] items-center gap-3.5 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3.5 text-white shadow-2xl backdrop-blur"
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base ${iconClasses}`}
      >
        {icon}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="text-sm">SwipeX</strong>
        <span className="truncate text-sm text-slate-300">{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="flex-shrink-0 text-lg text-slate-400 transition hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
