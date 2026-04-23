import { AuthRepository } from "../repositories/auth.repository.js";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function startRefreshTokenCleanupJob(): () => void {
  const authRepo = new AuthRepository();
  const run = async (): Promise<void> => {
    try {
      await authRepo.deleteExpiredRefreshTokens();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      process.stderr.write(`[refresh-token-cleanup] ${msg}\n`);
    }
  };
  void run();
  const id = setInterval(() => {
    void run();
  }, TWELVE_HOURS_MS);
  return () => clearInterval(id);
}
