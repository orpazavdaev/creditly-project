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

export function canRecordDocumentUploadAndNotes(role: string): boolean {
  return role === "ADMIN" || role === "USER";
}
