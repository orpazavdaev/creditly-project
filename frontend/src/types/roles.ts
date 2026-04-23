export type UserRole = "ADMIN" | "MANAGER" | "USER" | "BANKER";

export function isStaffRole(role: string): role is "ADMIN" | "MANAGER" | "USER" {
  return role === "ADMIN" || role === "MANAGER" || role === "USER";
}

export function isBankerRole(role: string): boolean {
  return role === "BANKER";
}

export function canOpenAuction(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canCreateAccount(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageAuctionForAccount(
  user: { id: string; role: string },
  account: { managerId: string }
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER") return user.id === account.managerId;
  return false;
}

export function canRecordDocumentUploadAndNotes(role: string): boolean {
  return role === "ADMIN" || role === "USER";
}
