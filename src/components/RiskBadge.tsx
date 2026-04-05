interface RiskBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ score, size = "md" }: RiskBadgeProps) {
  if (score === null) return null;

  const { label, className } = score >= 70
    ? { label: "High Risk", className: "bg-red-100 text-red-700 ring-1 ring-red-200" }
    : score >= 40
    ? { label: "Medium Risk", className: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200" }
    : { label: "Low Risk", className: "bg-green-100 text-green-700 ring-1 ring-green-200" };

  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-1";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        score >= 70 ? "bg-red-500" : score >= 40 ? "bg-yellow-500" : "bg-green-500"
      }`} />
      <span>{score}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}