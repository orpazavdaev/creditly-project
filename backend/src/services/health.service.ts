import type { HealthRepository } from "../repositories/health.repository.js";

export class HealthService {
  constructor(private readonly repo: HealthRepository) {}

  async getHealth(): Promise<{ status: string; ok: boolean }> {
    const { ok } = await this.repo.getStatus();
    return { status: ok ? "up" : "down", ok };
  }
}
