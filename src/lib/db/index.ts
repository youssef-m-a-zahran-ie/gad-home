import "server-only";
import { neon, types } from "@neondatabase/serverless";

/**
 * Server-only access to Neon. The connection string (DATABASE_URL, a Cloudflare secret) never
 * reaches the browser, so every read and write goes through server code in this app.
 */
const NUMERIC = 1700;
const INT8 = 20;
const TIMESTAMPS = new Set([1114, 1184]); // timestamp, timestamptz → ISO strings (UTC)
const DATE = 1082;

const parsers = {
  getTypeParser(oid: number, format?: "text" | "binary") {
    if (oid === NUMERIC || oid === INT8) return (v: string) => Number(v);
    if (TIMESTAMPS.has(oid)) {
      return (v: string) => {
        let t = v.replace(" ", "T");
        if (/[+-]\d\d$/.test(t)) t += ":00";
        else if (!/(Z|[+-]\d\d:\d\d)$/.test(t)) t += "Z";
        return new Date(t).toISOString();
      };
    }
    if (oid === DATE) return (v: string) => v;
    return types.getTypeParser(oid, format);
  },
};

let client: ReturnType<typeof neon> | undefined;
function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client ??= neon(url, { types: parsers as never });
  return client;
}

export type Row = Record<string, unknown>;
export type Stmt = [text: string, params?: unknown[]];

/** Runs one parametrised statement and returns its rows. */
export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as unknown as T[];
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}

/**
 * Runs statements in one transaction. When `email` is given, the admin's email is exposed to the
 * database as `app.user_email`, which the stock triggers use for `created_by`.
 * Returns the rows of each statement (without the set_config one).
 */
export async function tx(stmts: Stmt[], email?: string): Promise<Row[][]> {
  const s = sql();
  const list = [
    ...(email ? [s.query("select set_config('app.user_email', $1, true)", [email])] : []),
    ...stmts.map(([t, p]) => s.query(t, p ?? [])),
  ];
  const res = (await s.transaction(list)) as unknown as Row[][];
  return email ? res.slice(1) : res;
}

/** Postgres error → the shape friendlyDbError() understands. */
export function dbError(e: unknown): { code?: string; message?: string } {
  const err = e as { code?: string; message?: string };
  return { code: err?.code, message: err?.message };
}

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
