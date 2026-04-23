import { HttpError } from "../utils/http-error.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountRepository } from "../repositories/account.repository.js";

export class AccountAccessService {
  constructor(private readonly accountRepo: AccountRepository) {}

  async assertStaffCanAccessAccount(user: AuthUser, accountId: string): Promise<void> {
    if (user.role === "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    const row = await this.accountRepo.findAccessInfoById(accountId);
    if (!row) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
    if (user.role === "ADMIN") {
      return;
    }
    if (user.role === "MANAGER" && row.managerId === user.id) {
      return;
    }
    if (user.role === "USER" && row.accountUsers.some((u) => u.userId === user.id)) {
      return;
    }
    throw new HttpError(404, "Account not found", "account_not_found");
  }

  async assertManagerAdminCanAccessAccount(user: AuthUser, accountId: string): Promise<void> {
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    const row = await this.accountRepo.findAccessInfoById(accountId);
    if (!row) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
    if (user.role === "ADMIN") {
      return;
    }
    if (row.managerId === user.id) {
      return;
    }
    throw new HttpError(404, "Account not found", "account_not_found");
  }
}
