import { test } from "node:test";
import assert from "node:assert/strict";
import { detectSessionConflicts } from "../../src/lib/conflicts";
import type { AvailabilityBlock, VisitSession } from "../../src/lib/types";

function makeSession(overrides: Partial<VisitSession> = {}): VisitSession {
  return {
    id: "session-a",
    engagementId: "eng-a",
    clientId: "client-a",
    plannedStart: "2026-10-13T00:00:00.000Z", // 10:00 Brisbane
    plannedEnd: "2026-10-13T02:00:00.000Z", // 12:00 Brisbane
    status: "confirmed",
    suburb: "Suburb A",
    serviceType: "Domestic assistance",
    travelBufferBeforeMin: 15,
    travelBufferAfterMin: 15,
    ...overrides,
  };
}

test("no conflicts when the calendar is otherwise empty", () => {
  const session = makeSession();
  assert.deepEqual(detectSessionConflicts(session, [session], []), []);
});

test("two active sessions with directly overlapping times are flagged double-booked", () => {
  const a = makeSession({ id: "a" });
  const b = makeSession({ id: "b", clientId: "client-b", plannedStart: "2026-10-13T01:00:00.000Z", plannedEnd: "2026-10-13T03:00:00.000Z" });
  const conflicts = detectSessionConflicts(a, [a, b], []);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "double_booking");
});

test("back-to-back sessions with enough travel buffer do not conflict", () => {
  const a = makeSession({ id: "a", plannedStart: "2026-10-13T00:00:00.000Z", plannedEnd: "2026-10-13T02:00:00.000Z", travelBufferAfterMin: 10 });
  const b = makeSession({ id: "b", clientId: "client-b", plannedStart: "2026-10-13T02:30:00.000Z", plannedEnd: "2026-10-13T04:00:00.000Z", travelBufferBeforeMin: 10 });
  assert.deepEqual(detectSessionConflicts(a, [a, b], []), []);
});

test("not quite enough travel buffer is flagged (not a hard overlap, but insufficient travel)", () => {
  const a = makeSession({ id: "a", plannedStart: "2026-10-13T00:00:00.000Z", plannedEnd: "2026-10-13T02:00:00.000Z", travelBufferAfterMin: 30 });
  const b = makeSession({ id: "b", clientId: "client-b", plannedStart: "2026-10-13T02:15:00.000Z", plannedEnd: "2026-10-13T04:00:00.000Z", travelBufferBeforeMin: 10 });
  const conflicts = detectSessionConflicts(a, [a, b], []);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "insufficient_travel");
});

test("a proposed booking clashing with an unavailable block is flagged — never shown as conflict-free (blueprint Example D)", () => {
  const saturdaySession = makeSession({
    id: "saturday",
    status: "proposed",
    plannedStart: "2026-10-17T00:00:00.000Z",
    plannedEnd: "2026-10-17T02:00:00.000Z",
  });
  const familyDayBlock: AvailabilityBlock = {
    id: "block-family-day",
    startAt: "2026-10-16T14:00:00.000Z", // 00:00 Saturday Brisbane
    endAt: "2026-10-17T13:59:00.000Z", // 23:59 Saturday Brisbane
    blockType: "unavailable",
    displayLabel: "Family day — unavailable",
  };
  const conflicts = detectSessionConflicts(saturdaySession, [saturdaySession], [familyDayBlock]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "blocked_time");
});

test("cancelled/no-show sessions are excluded from conflict checks entirely", () => {
  const a = makeSession({ id: "a", status: "cancelled" });
  const b = makeSession({ id: "b", clientId: "client-b", plannedStart: a.plannedStart, plannedEnd: a.plannedEnd });
  assert.deepEqual(detectSessionConflicts(a, [a, b], []), []);
});
