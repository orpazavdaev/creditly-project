import { HttpError } from "../utils/http-error.js";
import { AccountRepository } from "../repositories/account.repository.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { toAccountStaffListItem, type AccountStaffListItem } from "../mappers/account-staff.mapper.js";
import type { AuthUser } from "../types/auth-user.js";
import { parseBody } from "../validation/parse-body.js";
import { CreateAccountBodySchema } from "../validation/schemas.js";

export class AccountCreateService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly authRepo: AuthRepository
  ) {}

  async createForStaff(user: AuthUser, body: unknown): Promise<{ account: AccountStaffListItem }> {
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    const data = parseBody(CreateAccountBodySchema, body);
    if (data.linkedUserId) {
      const u = await this.authRepo.findUserById(data.linkedUserId);
      if (!u || u.role !== "USER") {
        throw new HttpError(400, "Invalid assigned user", "invalid_linked_user");
      }
    }
    const row = await this.accountRepo.createForAdmin({
      managerId: user.id,
      costumerName: data.costumerName,
      costumerEmail: data.costumerEmail,
      costumerPhone: data.costumerPhone,
      linkedUserId: data.linkedUserId,
    });
    return { account: toAccountStaffListItem(row) };
  }
}
