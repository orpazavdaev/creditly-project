import type { DomainEventCreatedPayload } from "../domain-events.js";

export function onDomainEventCreatedBusiness(payload: DomainEventCreatedPayload): void {
  process.stdout.write(
    `[business] account=${payload.accountId} type=${payload.typeApi} eventId=${payload.id}\n`
  );
}
