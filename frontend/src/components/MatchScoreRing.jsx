// ==========================================
// MatchScoreRing
// Radial progress ring showing a match_score
// (0-100) as an SVG stroke-dasharray circle.
// ==========================================

function MatchScoreRing({ score = 0, size = 56, strokeWidth = 5 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? "#16a34a" // sx-success
      : clamped >= 60
      ? "#0d9488" // sx-primary
      : "#dc2626"; // sx-danger

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none text-sx-text"
          style={{ fontSize: size * 0.24 }}
        >
          {Math.round(clamped)}
        </span>
        <span
          className="leading-none text-sx-text-muted"
          style={{ fontSize: size * 0.14 }}
        >
          %
        </span>
      </div>
    </div>
  );
}

export default MatchScoreRing;
