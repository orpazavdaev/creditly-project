import type { PrismaClient } from "@prisma/client";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function startRefreshTokenCleanupJob(prisma: PrismaClient): () => void {
  const run = async (): Promise<void> => {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  };
  void run();
  const id = setInterval(run, TWELVE_HOURS_MS);
  return () => clearInterval(id);
}
