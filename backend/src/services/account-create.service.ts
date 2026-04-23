import { HttpError } from "../utils/http-error.js";
import { AccountRepository } from "../repositories/account.repository.js";
import { toAccountStaffListItem, type AccountStaffListItem } from "../mappers/account-staff.mapper.js";
import type { AuthUser } from "../types/auth-user.js";
import { parseBody } from "../validation/parse-body.js";
import { CreateAccountBodySchema } from "../validation/schemas.js";

export class AccountCreateService {
  constructor(private readonly accountRepo: AccountRepository) {}

  async createForStaff(user: AuthUser, body: unknown): Promise<{ account: AccountStaffListItem }> {
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    const data = parseBody(CreateAccountBodySchema, body);
    const row = await this.accountRepo.createForAdmin({
      managerId: user.id,
      costumerName: data.costumerName,
      costumerEmail: data.costumerEmail,
      costumerPhone: data.costumerPhone,
    });
    return { account: toAccountStaffListItem(row) };
  }
}
