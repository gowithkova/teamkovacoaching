import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { ReadinessState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

const CONFIG: Record<ReadinessState, { label: string; tone: "danger" | "amber" | "success"; Icon: typeof AlertTriangle }> = {
  red: { label: "Blocked", tone: "danger", Icon: ShieldAlert },
  amber: { label: "Needs review", tone: "amber", Icon: AlertTriangle },
  green: { label: "Ready", tone: "success", Icon: CheckCircle2 },
};

export function ReadinessBadge({ state }: { state: ReadinessState }) {
  const { label, tone, Icon } = CONFIG[state];
  return (
    <Badge tone={tone}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </Badge>
  );
}
