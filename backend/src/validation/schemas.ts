import { z } from "zod";

export const PathAccountIdSchema = z.object({
  id: z.string().min(1, "Invalid account id"),
});

export const PathAuctionIdSchema = z.object({
  id: z.string().min(1, "Invalid auction id"),
});

export const EventsListQuerySchema = z.object({
  accountId: z.string().min(1, "accountId query parameter is required"),
});

export const SpecialisationEnum = z.enum([
  "NEW_MORTGAGE",
  "REFINANCE",
  "PERSONAL_LOAN",
  "BUSINESS_LOAN",
]);

export const OpenAuctionBodySchema = z
  .object({
    classification: SpecialisationEnum,
  })
  .strict();

export const CreateAccountBodySchema = z
  .object({
    costumerName: z.string().min(1, "Customer name is required"),
    costumerEmail: z.string().min(1).email("Invalid email"),
    costumerPhone: z.string().min(1, "Phone is required"),
  })
  .strict();

export const SubmitOfferBodySchema = z.object({
  totalInterestRate: z.coerce.number().finite().positive(),
});

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
