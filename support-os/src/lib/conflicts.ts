import type { AvailabilityBlock, VisitSession } from "@/lib/types";
import { AVAILABILITY_LABEL } from "@/lib/types";
import { addMinutesIso, formatDateShort, formatTimeRange } from "@/lib/dates";

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

export interface SessionConflict {
  type: "double_booking" | "blocked_time" | "insufficient_travel";
  message: string;
}

const ACTIVE_STATUSES: VisitSession["status"][] = [
  "proposed",
  "tentative",
  "confirmed",
  "in_progress",
];

/** Window including travel buffers either side, used for overlap checks. */
function bufferedWindow(session: VisitSession): { start: string; end: string } {
  return {
    start: addMinutesIso(session.plannedStart, -session.travelBufferBeforeMin),
    end: addMinutesIso(session.plannedEnd, session.travelBufferAfterMin),
  };
}

export function detectSessionConflicts(
  session: VisitSession,
  allSessions: VisitSession[],
  blocks: AvailabilityBlock[],
): SessionConflict[] {
  const conflicts: SessionConflict[] = [];
  if (!ACTIVE_STATUSES.includes(session.status)) return conflicts;

  const window = bufferedWindow(session);

  for (const other of allSessions) {
    if (other.id === session.id) continue;
    if (!ACTIVE_STATUSES.includes(other.status)) continue;
    if (overlaps(session.plannedStart, session.plannedEnd, other.plannedStart, other.plannedEnd)) {
      conflicts.push({
        type: "double_booking",
        message: `Overlaps another booked visit on ${formatDateShort(other.plannedStart)} at ${formatTimeRange(other.plannedStart, other.plannedEnd)}.`,
      });
    } else if (overlaps(window.start, window.end, other.plannedStart, other.plannedEnd)) {
      conflicts.push({
        type: "insufficient_travel",
        message: `Not enough travel time before/after the visit on ${formatDateShort(other.plannedStart)} at ${formatTimeRange(other.plannedStart, other.plannedEnd)}.`,
      });
    }
  }

  for (const block of blocks) {
    if (block.blockType === "available") continue;
    if (overlaps(session.plannedStart, session.plannedEnd, block.startAt, block.endAt)) {
      conflicts.push({
        type: "blocked_time",
        message: `Clashes with "${block.displayLabel}" (${AVAILABILITY_LABEL[block.blockType]}).`,
      });
    }
  }

  return conflicts;
}

export function hasAnyConflict(
  session: VisitSession,
  allSessions: VisitSession[],
  blocks: AvailabilityBlock[],
): boolean {
  return detectSessionConflicts(session, allSessions, blocks).length > 0;
}
