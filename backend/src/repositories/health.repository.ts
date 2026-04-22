export class HealthRepository {
  getStatus(): Promise<{ ok: boolean }> {
    return Promise.resolve({ ok: true });
  }
}
