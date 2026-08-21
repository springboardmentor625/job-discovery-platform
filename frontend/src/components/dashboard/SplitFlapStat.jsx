import { useEffect, useState } from 'react';

/**
 * Mechanical "departure board" style stat block. Flips to the new value
 * whenever it changes, rather than a static number or a progress bar.
 */
export default function SplitFlapStat({ label, value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;
    setFlipping(true);
    const t = setTimeout(() => {
      setDisplayValue(value);
      setFlipping(false);
    }, 200);
    return () => clearTimeout(t);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-4 flex flex-col gap-2">
      <span className="text-xs font-mono uppercase tracking-widest text-textLo">{label}</span>
      <div className="bg-ink rounded-md px-3 py-2 self-start" style={{ perspective: '400px' }}>
        <span
          className={`font-mono text-3xl font-semibold text-gold inline-block ${
            flipping ? 'animate-flip' : ''
          }`}
        >
          {String(displayValue).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
