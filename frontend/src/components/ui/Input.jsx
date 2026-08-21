export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block mb-4">
      {label && (
        <span className="block text-xs font-mono uppercase tracking-wide text-textLo mb-1.5">
          {label}
        </span>
      )}
      <input
        className={`w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-textHi placeholder:text-textLo/60 focus:border-gold outline-none transition-colors ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-coral mt-1">{error}</span>}
    </label>
  );
}
