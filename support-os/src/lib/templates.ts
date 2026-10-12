import type { Lead, OperatorSettings } from "@/lib/types";
import { formatCents } from "@/lib/money";

/**
 * Copy-first templates (blueprint 5.9): generate editable, human-reviewed
 * text. Nothing here is ever sent automatically.
 */

export function enquiryAcknowledgment(lead: Lead, settings: OperatorSettings): string {
  return `Hi, thanks for reaching out about support in ${lead.suburb}.

I'd like to ask a few quick questions so I can see whether I'm the right fit and what's realistic to arrange:
- What kind of help is needed, and are there any tasks that must NOT be part of it (e.g. personal care, medication)?
- Is this NDIS, Support at Home (through a registered provider), or a private arrangement?
- What days/times and visit length would you like, and is it a one-off or ongoing?

I'll follow up as soon as I hear back.

${settings.tradingName}`;
}

export function screeningQuestions(lead: Lead): string {
  return `A few questions before we go further on ${lead.displayAlias}:

1. What help is actually needed during the visit, and what must NOT be performed?
2. Is there an approved support plan or provider instruction I should follow?
3. Who has authority to approve the worker and services, and who will pay the invoice?
4. What days, times, visit length, location and transport/vehicle needs apply?`;
}

export function scopeClarification(lead: Lead): string {
  const days = lead.proposedDays.length ? lead.proposedDays.join(", ") : "to be confirmed";
  const hours = lead.hoursPerVisit ? `${lead.hoursPerVisit} hours` : "to be confirmed";
  return `Just confirming the details for ${lead.displayAlias} before I put together a proposal:

- Days: ${days}
- Visit length: ${hours}
- Services requested: ${lead.requestedServices.join(", ") || "to be confirmed"}
- Suburb: ${lead.suburb}

Could you also confirm who the invoice should be addressed to, and whether this is NDIS, Support at Home, or private pay? Once I have that I can send a proposed rate.`;
}

export function providerAuthorisationRequest(lead: Lead): string {
  return `Hi, I'm following up on subcontracting for ${lead.displayAlias} in ${lead.suburb}.

Could you confirm:
- Whether I'm approved to deliver services for this participant as a third-party worker
- The services and hours approved, and the fee you're able to offer
- Your screening/insurance requirements and onboarding steps
- Invoicing details (who to bill, payment terms)

Happy to provide my police check, insurance and other documents as needed.`;
}

export function bookingConfirmation(lead: Lead, dateLabel: string, timeLabel: string): string {
  return `Confirming our visit for ${lead.displayAlias}: ${dateLabel}, ${timeLabel}, at ${lead.suburb}.

Please let me know if anything changes. Looking forward to it.`;
}

export function declineReferral(lead: Lead): string {
  return `Thanks for thinking of me for ${lead.displayAlias}. Based on what's been described, this request involves support (such as personal care, medication administration, or clinical tasks) that's outside my current scope and qualifications.

I'd recommend reaching out to a registered provider who can safely support this. Happy to help with anything else that fits within companionship, domestic assistance, community access or similar.`;
}

export function paymentReminder(invoiceNumber: string, amountCents: number, dueDateLabel: string): string {
  return `Hi, just a friendly reminder that invoice ${invoiceNumber} for ${formatCents(amountCents)} was due ${dueDateLabel}. Let me know if it's already on its way or if anything's needed from me to help it along. Thanks!`;
}
