import type { DomainEventCreatedPayload } from "../domain-events.js";

export function onDomainEventCreatedCrm(payload: DomainEventCreatedPayload): void {
  process.stdout.write(
    `[crm] enqueue sync account=${payload.accountId} type=${payload.typeApi} eventId=${payload.id}\n`
  );
}
