"use client";

import { useQuery } from "@tanstack/react-query";

type Health = {
  status: string;
  ok: boolean;
};

export function HealthStatus() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const q = useQuery({
    queryKey: ["health", base],
    queryFn: async (): Promise<Health> => {
      const res = await fetch(`${base}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as Health;
    },
  });

  if (q.isPending) {
    return <p>Checking API…</p>;
  }
  if (q.isError) {
    return <p>API error: {q.error instanceof Error ? q.error.message : "unknown"}</p>;
  }
  return <p>Backend health: {q.data?.status}</p>;
}
