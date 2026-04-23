import type { EventBus } from "../event-bus.js";
import type { CrmService } from "../../services/crm.service.js";
import type { WinningOfferSelectedPayload } from "../crm-integration-events.js";

export function registerCrmWinningOfferListener(
  bus: EventBus,
  topic: string,
  crm: CrmService
): void {
  bus.on(topic, (payload: WinningOfferSelectedPayload) => {
    void crm.handleWinningOfferSelected(payload).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[crm] winning offer sync unexpected", msg);
    });
  });
}
