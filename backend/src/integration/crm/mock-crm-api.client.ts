export const CRM_FAILURE_RATE = Number(process.env.CRM_FAILURE_RATE ?? 0.35);

export type CrmApiClient = {
  push(accountId: string, ctx: string): Promise<void>;
};

export class MockCrmApiClient implements CrmApiClient {
  async push(accountId: string, ctx: string): Promise<void> {
    await Promise.resolve();
    const rate = Number.isFinite(CRM_FAILURE_RATE) ? CRM_FAILURE_RATE : 0.35;
    const p = rate < 0 ? 0 : rate > 1 ? 1 : rate;
    if (Math.random() < p) {
      throw new Error(`CRM push failed: ${ctx} (accountId=${accountId})`);
    }
  }
}
