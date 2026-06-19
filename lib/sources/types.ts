/** Result of syncing a single source for a user. */
export interface SyncResult {
  imported: number;
  byType: Record<string, number>;
}

/** A provider-agnostic normalized activity, ready to upsert into the Activity table. */
export interface ActivityRow {
  provider: string;
  type: string;
  externalId: string;
  title: string;
  body: string | null;
  url: string;
  metrics: string | null; // JSON text
  occurredAt: Date | null;
  raw: string; // JSON text
}
