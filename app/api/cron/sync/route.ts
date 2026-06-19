import { runSyncPass } from "@/lib/sources/sync";

/**
 * Continuous-sync worker entrypoint. Trigger from a scheduler (Vercel Cron in
 * prod, or any cron hitting this with `Authorization: Bearer $CRON_SECRET`).
 * Pulls deltas from every connected source for every user, then drafts new
 * suggestions via additive synthesis.
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization");
  if (!secret || provided !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await runSyncPass();
  return Response.json(result);
}
