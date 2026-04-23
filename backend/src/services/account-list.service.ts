import { HttpError } from "../utils/http-error.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountRepository } from "../repositories/account.repository.js";
import { toAccountStaffListItem, type AccountStaffListItem } from "../mappers/account-staff.mapper.js";

export class AccountListService {
  constructor(private readonly accountRepo: AccountRepository) {}

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
}
