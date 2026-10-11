import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldStyles =
  "w-full rounded-lg border border-line-strong bg-surface px-3 h-11 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-accent";

function Wrapper({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label} hint={hint}>
      <input className={cn(fieldStyles, className)} {...props} />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: { label: string; hint?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper label={label} hint={hint}>
      <select className={cn(fieldStyles, className)} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper label={label} hint={hint}>
      <textarea
        className={cn(fieldStyles, "h-auto min-h-24 py-2.5 resize-y", className)}
        {...props}
      />
    </Wrapper>
  );
}
