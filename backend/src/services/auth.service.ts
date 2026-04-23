import type { UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import type { AppEnv } from "../types/env.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { HttpError } from "../utils/http-error.js";
import { hashToken } from "../utils/hash-token.js";
import { parseBody } from "../validation/parse-body.js";
import { LoginBodySchema, RegisterBodySchema } from "../validation/schemas.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly env: AppEnv
  ) {}

  async register(body: unknown): Promise<{ id: string; email: string; role: UserRole }> {
    const { email, password, role } = parseBody(RegisterBodySchema, body);
    const n = normalizeEmail(email);
    if (!EMAIL_RE.test(n)) {
      throw new HttpError(400, "Invalid email", "invalid_email");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await this.repo.createUser({
        email: n,
        passwordHash,
        role,
      });
      return { id: user.id, email: user.email, role: user.role };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Email already registered", "email_taken");
      }
      throw e;
    }
  }

  async login(
    body: unknown,
    res: Response
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const { email, password } = parseBody(LoginBodySchema, body);
    const n = normalizeEmail(email);
    if (!EMAIL_RE.test(n)) {
      throw new HttpError(400, "Invalid email", "invalid_email");
    }
    const user = await this.repo.findUserByEmail(n);
    if (!user) {
      throw new HttpError(401, "Invalid credentials", "invalid_credentials");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials", "invalid_credentials");
    }
    const accessToken = this.signAccess(user.id, user.email, user.role);
    const refreshPlain = randomBytes(48).toString("base64url");
    const tokenHash = hashToken(refreshPlain);
    const expiresAt = this.refreshExpiryDate();
    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    const maxAgeMs = expiresAt.getTime() - Date.now();
    res.cookie(this.env.refreshCookieName, refreshPlain, {
      httpOnly: true,
      secure: this.env.cookieSecure,
      sameSite: "lax",
      path: "/auth",
      maxAge: maxAgeMs,
    });
    return {
      accessToken,
      expiresIn: this.env.accessTokenExpiresSeconds,
    };
  }

  async refresh(req: Request, res: Response): Promise<{ accessToken: string; expiresIn: number }> {
    const raw = req.cookies?.[this.env.refreshCookieName];
    if (typeof raw !== "string" || !raw) {
      throw new HttpError(401, "Missing refresh token", "missing_refresh");
    }
    const tokenHash = hashToken(raw);
    const row = await this.repo.findRefreshTokenByHash(tokenHash);
    if (!row) {
      throw new HttpError(401, "Invalid refresh token", "invalid_refresh");
    }
    await this.repo.deleteRefreshTokenById(row.id);
    const user = await this.repo.findUserById(row.userId);
    if (!user) {
      throw new HttpError(401, "User not found", "invalid_refresh");
    }
    const accessToken = this.signAccess(user.id, user.email, user.role);
    const refreshPlain = randomBytes(48).toString("base64url");
    const newHash = hashToken(refreshPlain);
    const expiresAt = this.refreshExpiryDate();
    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: newHash,
      expiresAt,
    });
    const maxAgeMs = expiresAt.getTime() - Date.now();
    res.cookie(this.env.refreshCookieName, refreshPlain, {
      httpOnly: true,
      secure: this.env.cookieSecure,
      sameSite: "lax",
      path: "/auth",
      maxAge: maxAgeMs,
    });
    return {
      accessToken,
      expiresIn: this.env.accessTokenExpiresSeconds,
    };
  }

  private signAccess(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      { sub: userId, email, role },
      this.env.jwtSecret,
      { expiresIn: this.env.accessTokenExpiresSeconds }
    );
  }

  private refreshExpiryDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + this.env.refreshTokenExpiresDays);
    return d;
  }
}
