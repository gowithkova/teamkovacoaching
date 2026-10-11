import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "accent" | "amber" | "danger" | "success";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-chip text-neutral-chip-ink",
  accent: "bg-accent-soft text-accent-strong",
  amber: "bg-amber-soft text-amber border border-amber-line",
  danger: "bg-danger-soft text-danger border border-danger-line",
  success: "bg-success-soft text-success",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
