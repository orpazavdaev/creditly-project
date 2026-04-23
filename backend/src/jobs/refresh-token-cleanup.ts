import type { PrismaClient } from "@prisma/client";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function startRefreshTokenCleanupJob(prisma: PrismaClient): () => void {
  const run = async (): Promise<void> => {
    try {
      await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
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
