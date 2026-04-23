import type { UserRole } from "./roles";

export type AccountListItem = {
  id: string;
  managerId: string;
  costumerEmail: string;
  costumerPhone: string;
  costumerName: string;
  status: string;
  lastActivity: string;
  isHighActivity: boolean;
  syncStatus: string;
  failureReason: string | null;
  createdAt: string;
};

export type AccountDetailItem = AccountListItem & {
  auction: {
    id: string;
    status: string;
    expiresAt: string;
    classification: string;
  } | null;
};

export type EventRow = {
  id: string;
  accountId: string;
  userId: string;
  type: string;
  createdAt: string;
  metadata: unknown;
};

export type BankerAuctionRow = {
  id: string;
  classification: string;
  status: string;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
};

export type AuctionOffersResponse = {
  auction: {
    id: string;
    classification: string;
    status: string;
    expiresAt: string;
  };
  offers: {
    id: string;
    auctionOpportunityId: string;
    bankId: string;
    bankerId: string;
    totalInterestRate: number;
    createdAt: string;
  }[];
};

export type RegisterBody = {
  email: string;
  password: string;
  role: UserRole;
};
