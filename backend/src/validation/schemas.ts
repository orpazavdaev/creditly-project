import { z } from "zod";

export const LoginBodySchema = z.object({
  email: z.string().min(1, "email is required"),
  password: z.string().min(1, "password is required"),
});

export const RegisterBodySchema = z.object({
  email: z.string().min(1, "email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MANAGER", "USER", "BANKER"]),
});

export const EventCreateBodySchema = z.object({
  accountId: z.string().min(1, "accountId is required"),
  type: z.enum([
    "document_uploaded",
    "note_added",
    "status_changed",
    "auction_opened",
    "offer_submitted",
    "auction_closed",
  ]),
  metadata: z.union([z.record(z.string(), z.unknown()), z.null()]).optional(),
});
