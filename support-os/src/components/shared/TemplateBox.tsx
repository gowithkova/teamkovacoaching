"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export interface TemplateOption {
  key: string;
  label: string;
  text: string;
}

export function TemplateBox({ options }: { options: TemplateOption[] }) {
  const [key, setKey] = useState(options[0]?.key);
  const [copied, setCopied] = useState(false);
  const active = options.find((o) => o.key === key) ?? options[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) — selection fallback below still works.
    }
  }

  if (!active) return null;

  return (
    <div className="space-y-2">
      <SelectField label="Template" value={key} onChange={(e) => setKey(e.target.value)}>
        {options.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </SelectField>
      <textarea
        readOnly
        value={active.text}
        rows={6}
        className="w-full rounded-lg border border-line-strong bg-surface-sunken px-3 py-2.5 text-sm text-ink"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {copied ? "Copied" : "Copy to clipboard"}
      </Button>
    </div>
  );
}
