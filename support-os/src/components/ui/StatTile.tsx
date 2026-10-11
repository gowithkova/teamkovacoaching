import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "amber" | "danger";
  hint?: string;
}) {
  const toneClass = {
    default: "text-ink",
    success: "text-success",
    amber: "text-amber",
    danger: "text-danger",
  }[tone];

  return (
    <div className="flex-1 min-w-[140px]">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular", toneClass)}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
