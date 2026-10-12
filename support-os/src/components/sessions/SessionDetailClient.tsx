"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { SESSION_STATUS_LABEL } from "@/lib/types";
import type { AvailabilityBlock, Client, Contact, Engagement, ServiceNote, VisitSession } from "@/lib/types";
import { formatDateLong, formatTimeRange } from "@/lib/dates";
import { detectSessionConflicts } from "@/lib/conflicts";
import {
  confirmSession as confirmSessionAction,
  correctSessionTimes as correctSessionTimesAction,
  recordCancellation as recordCancellationAction,
  completeSessionWithNote,
  startSession as startSessionAction,
} from "@/lib/db/sessions";

export function SessionDetailClient({
  session,
  client,
  engagement,
  contacts,
  note,
  allSessions,
  availabilityBlocks,
}: {
  session: VisitSession | null;
  client?: Client;
  engagement?: Engagement;
  contacts: Contact[];
  note?: ServiceNote;
  allSessions: VisitSession[];
  availabilityBlocks: AvailabilityBlock[];
}) {
  const router = useRouter();
  const { addIncident } = useStore(); // Incidents/Documents aren't persisted yet (Gate 4) — kept on the Gate 1 store deliberately.
  const [isPending, startTransition] = useTransition();

  const [elapsedMs, setElapsedMs] = useState(0);
  const [noteDraft, setNoteDraft] = useState({ activities: "", participantResponse: "", factualObservations: "", nextSteps: "" });
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelChargeable, setCancelChargeable] = useState(false);
  const [showConcern, setShowConcern] = useState(false);
  const [concernText, setConcernText] = useState("");
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctStart, setCorrectStart] = useState("");
  const [correctEnd, setCorrectEnd] = useState("");

  useEffect(() => {
    if (!session || session.status !== "in_progress" || !session.actualStart) return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - new Date(session.actualStart!).getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">Session not found.</p>
        <Link href="/sessions" className="text-sm text-accent-strong hover:underline">Back to sessions</Link>
      </div>
    );
  }

  const sessionId = session.id;
  const emergencyContact = contacts.find((c) => c.clientId === session.clientId && c.role === "emergency_contact") ?? contacts.find((c) => c.clientId === session.clientId);
  const conflicts = detectSessionConflicts(session, allSessions, availabilityBlocks);

  const minutes = Math.floor(elapsedMs / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1000);

  function runAction(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function handleFinish() {
    if (!noteDraft.activities.trim()) return;
    runAction(() => completeSessionWithNote(sessionId, noteDraft));
  }

  function handleSubmitCancellation() {
    runAction(() =>
      recordCancellationAction(
        sessionId,
        cancelReason,
        cancelChargeable,
        cancelChargeable ? "Within the agreed short-notice window." : "Outside the chargeable window / goodwill.",
      ),
    );
    setShowCancel(false);
  }

  function handleReportConcern() {
    addIncident({
      clientId: session!.clientId,
      sessionId: sessionId,
      occurredAt: new Date().toISOString(),
      factualDescription: concernText,
      immediateActions: "Logged during visit via quick action.",
    });
    setConcernText("");
    setShowConcern(false);
  }

  const canInvoice = engagement?.readinessState === "green";

  return (
    <div className="space-y-4">
      <Link href="/sessions" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Back to sessions
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-ink">{session.serviceType}</h2>
          <p className="text-sm text-ink-soft">
            {client?.displayName ?? "Client"} · {session.suburb} · {formatDateLong(session.plannedStart)} · {formatTimeRange(session.plannedStart, session.plannedEnd)}
          </p>
        </div>
        <Badge tone="neutral">{SESSION_STATUS_LABEL[session.status]}</Badge>
      </div>

      {conflicts.length > 0 && (session.status === "proposed" || session.status === "tentative") && (
        <Card className="border-danger-line">
          <CardBody className="space-y-1 pt-4">
            <p className="text-sm font-semibold text-danger">Can&apos;t confirm — resolve this first</p>
            <ul className="list-inside list-disc text-sm text-ink-soft">
              {conflicts.map((c, i) => <li key={i}>{c.message}</li>)}
            </ul>
          </CardBody>
        </Card>
      )}

      {client && (
        <Card>
          <CardHeader><CardTitle>Approved scope</CardTitle></CardHeader>
          <CardBody className="flex flex-wrap gap-1.5">
            {client.supportBrief.approvedActivities.map((a) => <Badge key={a} tone="success">{a}</Badge>)}
            {client.supportBrief.excludedActivities.map((a) => <Badge key={a} tone="danger">{a}</Badge>)}
          </CardBody>
        </Card>
      )}

      {client?.supportBrief.emergencyInstruction && (
        <Card>
          <CardHeader><CardTitle>Emergency instruction</CardTitle></CardHeader>
          <CardBody className="flex items-center justify-between pt-4">
            <p className="text-sm text-ink">{client.supportBrief.emergencyInstruction}</p>
            {emergencyContact?.phone && (
              <a href={`tel:${emergencyContact.phone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
                <Phone size={14} aria-hidden="true" /> Call
              </a>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex gap-2">
            {(session.status === "proposed" || session.status === "tentative") && (
              <Button variant="primary" disabled={conflicts.length > 0 || isPending} onClick={() => runAction(() => confirmSessionAction(sessionId))}>
                Confirm visit
              </Button>
            )}
            {session.status === "confirmed" && (
              <Button variant="primary" disabled={isPending} onClick={() => runAction(() => startSessionAction(sessionId))}>Start visit</Button>
            )}
            {session.status === "in_progress" && (
              <span className="tabular text-lg font-semibold text-ink">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} elapsed
              </span>
            )}
          </div>
          {["proposed", "tentative", "confirmed", "in_progress"].includes(session.status) && (
            <div className="flex gap-2">
              {emergencyContact?.phone && (
                <a href={`tel:${emergencyContact.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm font-medium text-ink hover:border-accent">
                  <Phone size={14} aria-hidden="true" /> Call contact
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowConcern(true)}>Report concern</Button>
              {session.status !== "in_progress" && (
                <Button variant="ghost" size="sm" onClick={() => setShowCancel(true)}>Cancel visit</Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {session.status === "in_progress" && (
        <Card>
          <CardHeader><CardTitle>Finish &amp; write the visit note (about 60 seconds)</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <TextAreaField label="Activities completed" rows={2} value={noteDraft.activities} onChange={(e) => setNoteDraft((d) => ({ ...d, activities: e.target.value }))} />
            <TextAreaField label="Participation / response (incl. client feedback if appropriate)" rows={2} value={noteDraft.participantResponse} onChange={(e) => setNoteDraft((d) => ({ ...d, participantResponse: e.target.value }))} />
            <TextAreaField label="Changes or concerns observed (factual only)" rows={2} value={noteDraft.factualObservations} onChange={(e) => setNoteDraft((d) => ({ ...d, factualObservations: e.target.value }))} />
            <TextAreaField label="Actions / follow-up" rows={2} value={noteDraft.nextSteps} onChange={(e) => setNoteDraft((d) => ({ ...d, nextSteps: e.target.value }))} />
            <Button variant="primary" onClick={handleFinish} disabled={!noteDraft.activities.trim() || isPending}>Finish visit</Button>
          </CardBody>
        </Card>
      )}

      {session.status === "completed" && !session.noteId && (
        <Card>
          <CardHeader><CardTitle>This visit needs its note</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <TextAreaField label="Activities completed" rows={2} value={noteDraft.activities} onChange={(e) => setNoteDraft((d) => ({ ...d, activities: e.target.value }))} />
            <TextAreaField label="Participation / response (incl. client feedback if appropriate)" rows={2} value={noteDraft.participantResponse} onChange={(e) => setNoteDraft((d) => ({ ...d, participantResponse: e.target.value }))} />
            <TextAreaField label="Changes or concerns observed (factual only)" rows={2} value={noteDraft.factualObservations} onChange={(e) => setNoteDraft((d) => ({ ...d, factualObservations: e.target.value }))} />
            <TextAreaField label="Actions / follow-up" rows={2} value={noteDraft.nextSteps} onChange={(e) => setNoteDraft((d) => ({ ...d, nextSteps: e.target.value }))} />
            <Button variant="primary" onClick={handleFinish} disabled={!noteDraft.activities.trim() || isPending}>Save note</Button>
          </CardBody>
        </Card>
      )}

      {note && (
        <Card>
          <CardHeader>
            <CardTitle>Visit note</CardTitle>
            <button className="text-xs text-ink-faint hover:text-ink-soft" onClick={() => { setCorrectStart(session.actualStart ?? session.plannedStart); setCorrectEnd(session.actualEnd ?? session.plannedEnd); setShowCorrect(true); }}>
              Correct times
            </button>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p><span className="text-ink-faint">Activities: </span>{note.activities}</p>
            <p><span className="text-ink-faint">Response: </span>{note.participantResponse}</p>
            <p><span className="text-ink-faint">Observations: </span>{note.factualObservations}</p>
            <p><span className="text-ink-faint">Follow-up: </span>{note.nextSteps}</p>
          </CardBody>
        </Card>
      )}

      {note && !session.invoiceLineId && (
        <Card>
          <CardBody className="pt-4">
            {canInvoice ? (
              <p className="text-sm text-ink-soft">Ready to invoice — invoicing is still Gate 1&apos;s synthetic data and isn&apos;t linked to real sessions yet, lands with the Money migration (Gate 3).</p>
            ) : (
              <p className="text-sm text-amber">Cannot invoice yet — engagement has an unresolved blocker. See the client&apos;s Service tab.</p>
            )}
          </CardBody>
        </Card>
      )}

      {session.cancellation && (
        <Card>
          <CardHeader><CardTitle>Cancellation</CardTitle></CardHeader>
          <CardBody className="space-y-1 text-sm">
            <p className="text-ink">{session.cancellation.reason}</p>
            <p className="text-ink-soft">
              {session.cancellation.chargeable ? "Chargeable" : "Not charged"} — {session.cancellation.chargeableReason}
            </p>
          </CardBody>
        </Card>
      )}

      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel this visit">
        <div className="space-y-3">
          <TextAreaField label="Reason" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={cancelChargeable} onChange={(e) => setCancelChargeable(e.target.checked)} />
            Chargeable under the agreed cancellation terms
          </label>
          <Button variant="danger" onClick={handleSubmitCancellation} disabled={!cancelReason.trim() || isPending}>Confirm cancellation</Button>
        </div>
      </Modal>

      <Modal open={showConcern} onClose={() => setShowConcern(false)} title="Report a concern">
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">For immediate danger, call 000 first. This creates a factual incident record — not an automatic report to any authority.</p>
          <TextAreaField label="What happened" rows={3} value={concernText} onChange={(e) => setConcernText(e.target.value)} />
          <Button variant="primary" onClick={handleReportConcern} disabled={!concernText.trim()}>Log incident</Button>
        </div>
      </Modal>

      <Modal open={showCorrect} onClose={() => setShowCorrect(false)} title="Correct actual times">
        <div className="space-y-3">
          <TextField label="Actual start" type="datetime-local" value={correctStart.slice(0, 16)} onChange={(e) => setCorrectStart(new Date(e.target.value).toISOString())} />
          <TextField label="Actual end" type="datetime-local" value={correctEnd.slice(0, 16)} onChange={(e) => setCorrectEnd(new Date(e.target.value).toISOString())} />
          <p className="text-xs text-ink-faint">Manual corrections are kept in the audit trail (full audit log lands in Gate 4).</p>
          <Button
            variant="primary"
            disabled={isPending}
            onClick={() => {
              runAction(() => correctSessionTimesAction(sessionId, correctStart, correctEnd));
              setShowCorrect(false);
            }}
          >
            Save correction
          </Button>
        </div>
      </Modal>
    </div>
  );
}
