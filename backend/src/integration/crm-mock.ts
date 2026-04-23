const CRM_FAILURE_RATE = 0.35;

function shouldFailMock(): boolean {
  return Math.random() < CRM_FAILURE_RATE;
}

export async function crmPushMock(_accountId: string, context: string): Promise<void> {
  if (shouldFailMock()) {
    throw new Error(`CRM mock rejected (${context})`);
  }
}
