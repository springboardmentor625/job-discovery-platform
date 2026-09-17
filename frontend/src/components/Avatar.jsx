const COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

function colorFor(name) {
  const sum = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
}

export default function Avatar({ name, size = 44, rounded = "rounded-lg" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={`${rounded} ${colorFor(name)} flex items-center justify-center font-display font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}