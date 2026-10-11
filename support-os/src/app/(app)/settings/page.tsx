"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [weeklyTarget, setWeeklyTarget] = useState(String(settings.weeklyGrossTargetCents / 100));
  const [maxTravel, setMaxTravel] = useState(String(settings.maxTravelMinutesPerDay));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Business profile</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <TextField label="Trading name" defaultValue={settings.tradingName} onBlur={(e) => updateSettings({ tradingName: e.target.value })} />
          <TextField label="ABN" defaultValue={settings.abn} disabled />
          <p className="text-xs text-ink-faint">Synthetic placeholder — verify your real ABN, insurances and registrations before going live.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Targets</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <TextField
            label="Weekly gross income target (AUD)"
            type="number"
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(e.target.value)}
            onBlur={() => updateSettings({ weeklyGrossTargetCents: Math.round((Number(weeklyTarget) || 0) * 100) })}
          />
          <TextField
            label="Maximum travel minutes per day"
            type="number"
            value={maxTravel}
            onChange={(e) => setMaxTravel(e.target.value)}
            onBlur={() => updateSettings({ maxTravelMinutesPerDay: Number(maxTravel) || 0 })}
          />
          <p className="text-xs text-ink-faint">This is a temporary working target, not a permanent figure — adjust it any time.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={settings.privacyScreenEnabled}
              onChange={(e) => updateSettings({ privacyScreenEnabled: e.target.checked })}
            />
            Privacy screen — obscure client names/addresses in public spaces
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Data export</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-sm text-ink-soft">Export your business records as CSV/PDF — lands with real persistence in Gate 1.1.</p>
          <Button variant="secondary" disabled>Export (coming in Gate 1.1)</Button>
        </CardBody>
      </Card>

      <p className="text-xs text-ink-faint">This prototype keeps data in memory for the session only — nothing is sent anywhere, and it resets on reload. Gate 2 adds a real database.</p>
    </div>
  );
}
