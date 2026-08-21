const variants = {
  primary: 'bg-gold text-inkOnPaper hover:bg-gold/90',
  teal: 'bg-teal text-ink hover:bg-teal/90',
  coral: 'bg-coral text-ink hover:bg-coral/90',
  ghost: 'bg-transparent border border-textLo/40 text-textHi hover:border-gold hover:text-gold',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`px-5 py-2.5 rounded-md font-body font-semibold text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
