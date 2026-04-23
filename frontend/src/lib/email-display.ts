export function emailLocalPart(email: string): string {
  const i = email.indexOf("@");
  if (i <= 0) return email.trim() || "—";
  return email.slice(0, i).trim() || "—";
}
