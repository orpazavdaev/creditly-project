import type {
  AccountStatus,
  AuctionOpportunityStatus,
  EventTypeApi,
  Specialisation,
  SyncStatus,
  UserRole,
} from "./domain";

export type AccountListItem = {
  id: string;
  managerId: string;
  costumerEmail: string;
  costumerPhone: string;
  costumerName: string;
  status: AccountStatus;
  lastActivity: string;
  isHighActivity: boolean;
  syncStatus: SyncStatus;
  failureReason: string | null;
  createdAt: string;
};

export type AccountDetailItem = AccountListItem & {
  auction: {
    id: string;
    status: AuctionOpportunityStatus;
    openedAt: string;
    expiresAt: string;
    closedAt: string | null;
    classification: Specialisation;
    winningOffer: { totalInterestRate: number; bankName: string } | null;
    canCloseAuction: boolean;
  } | null;
};

export type EventRow = {
  id: string;
  accountId: string;
  userId: string;
  type: EventTypeApi;
  createdAt: string;
  metadata: unknown;
  createdByLabel: string;
};

export type AdminAllAuctionRow = {
  id: string;
  accountId: string;
  classification: Specialisation;
  status: AuctionOpportunityStatus;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
  winningOffer: { totalInterestRate: number; bankName: string } | null;
};

export type BankerAuctionRow = {
  id: string;
  classification: Specialisation;
  status: AuctionOpportunityStatus;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
};

export type AuctionOffersResponse = {
  auction: {
    id: string;
    classification: Specialisation;
    status: AuctionOpportunityStatus;
    expiresAt: string;
    accountId?: string;
    openedAt?: string;
  };
  offers: {
    id: string;
    auctionOpportunityId: string;
    bankId: string;
    bankerId: string;
    totalInterestRate: number;
    createdAt: string;
    bankName?: string;
    createdByLabel?: string;
  }[];
};

export type RegisterBody = {
  email: string;
  password: string;
  role: UserRole;
};
