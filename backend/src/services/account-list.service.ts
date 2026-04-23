import { HttpError } from "../utils/http-error.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountRepository } from "../repositories/account.repository.js";
import {
  toAccountStaffDetailItem,
  toAccountStaffListItem,
  type AccountStaffDetailItem,
  type AccountStaffListItem,
} from "../mappers/account-staff.mapper.js";
import { AccountAccessService } from "./account-access.service.js";
import type { AuctionLifecycleRepository } from "../repositories/auction-lifecycle.repository.js";

export class AccountListService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly accountAccess: AccountAccessService,
    private readonly lifecycleRepo: AuctionLifecycleRepository
  ) {}

  async listForUser(user: AuthUser): Promise<{ accounts: AccountStaffListItem[] }> {
    if (user.role === "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    if (user.role === "ADMIN") {
      const rows = await this.accountRepo.findAllForStaffList();
      return { accounts: rows.map(toAccountStaffListItem) };
    }
    if (user.role === "MANAGER") {
      const rows = await this.accountRepo.findByManagerIdForStaffList(user.id);
      return { accounts: rows.map(toAccountStaffListItem) };
    }
    if (user.role === "USER") {
      const rows = await this.accountRepo.findByAssignedUserForStaffList(user.id);
      return { accounts: rows.map(toAccountStaffListItem) };
    }
    throw new HttpError(403, "Forbidden", "forbidden");
  }

  async getById(user: AuthUser, accountId: string): Promise<{ account: AccountStaffDetailItem }> {
    if (user.role === "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    await this.accountAccess.assertStaffCanAccessAccount(user, accountId);
    const row = await this.accountRepo.findStaffDetailById(accountId);
    if (!row) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
    if (row.auctionOpportunity) {
      await this.lifecycleRepo.expireOpenIfPastDue(row.auctionOpportunity.id);
      const updated = await this.accountRepo.findStaffDetailById(accountId);
      if (!updated) {
        throw new HttpError(404, "Account not found", "account_not_found");
      }
      return { account: toAccountStaffDetailItem(updated) };
    }
    return { account: toAccountStaffDetailItem(row) };
  }
}
