import { HttpError } from "../utils/http-error.js";
import type { AuthUser } from "../types/auth-user.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { toAnalyticsSummaryApi, type AnalyticsSummaryApi } from "../mappers/analytics-summary.mapper.js";

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async getSummary(user: AuthUser): Promise<{ summary: AnalyticsSummaryApi }> {
    if (user.role === "ADMIN") {
      const raw = await this.repo.summarizeForScope(null);
      return { summary: toAnalyticsSummaryApi(raw) };
    }
    throw new HttpError(403, "Forbidden", "forbidden");
  }
}
