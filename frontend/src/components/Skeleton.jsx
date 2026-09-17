export function SkeletonLine({ width = "100%", height = "1rem", className = "" }) {
  return (
    <div
      className={`skeleton rounded-md ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-line rounded-xl p-5 bg-white space-y-3">
      <SkeletonLine width="60%" height="1.25rem" />
      <SkeletonLine width="40%" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="80%" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}