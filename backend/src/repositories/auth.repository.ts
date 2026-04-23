import type { User, UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";

export class AuthRepository {
  findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findUsersByRole(role: UserRole): Promise<{ id: string; email: string }[]> {
    return prisma.user.findMany({
      where: { role },
      orderBy: { email: "asc" },
      select: { id: true, email: true },
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
  }

  deleteRefreshTokenById(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  }

  deleteExpiredRefreshTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
