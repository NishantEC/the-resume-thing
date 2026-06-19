/**
 * Next.js server-boot hook. Runs the continuous sync worker locally so a single
 * `yarn dev` keeps pulling new work from every connected source. In production
 * prefer a real scheduler hitting /api/cron/sync instead (set WORKER_ENABLED off).
 */
export async function register(): Promise<void> {
  // instrumentation loads in BOTH the Edge and Node runtimes; the worker uses
  // Node-only Prisma (better-sqlite3), so guard to Node and gate behind a flag.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.WORKER_ENABLED !== "true") return;

  // Dynamic import (rule exception: platform-specific module): a static import
  // would pull Node-only Prisma into the Edge bundle where this file also loads.
  const { runSyncPass } = await import("@/lib/sources/sync");

  const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 600_000);
  console.log(`[worker] continuous sync enabled (every ${intervalMs}ms)`);
  setInterval(() => {
    runSyncPass()
      .then((r) => console.log(`[worker] pass: ${r.users} users, +${r.imported} imported`))
      .catch((err) => console.error("[worker]", err));
  }, intervalMs);
}
