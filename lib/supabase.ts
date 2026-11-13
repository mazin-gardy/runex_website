// Reads and writes Supabase from the server, using its REST API (no extra packages needed).
// Keys come from .env.local (local) or Vercel → Settings → Environment Variables:
//   SUPABASE_URL=https://<project>.supabase.co
//   SUPABASE_ANON_KEY=<anon / public key>      never the service_role key

const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** GET rows, e.g. supabaseSelect("sessions", "id=eq.123&select=title"). */
export async function supabaseSelect<T>(table: string, query: string): Promise<T[]> {
  if (!supabaseConfigured) throw new Error("Supabase isn't set up: add SUPABASE_URL and SUPABASE_ANON_KEY.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store", // always fresh, so the "going" count is live
  });
  if (!res.ok) throw new Error(`Supabase ${table} read failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/** Error from Supabase, with the HTTP status (e.g. 409 when a unique value already exists). */
export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Insert one row. */
export async function supabaseInsert(table: string, row: Record<string, unknown>): Promise<void> {
  if (!supabaseConfigured) throw new Error("Supabase isn't set up: add SUPABASE_URL and SUPABASE_ANON_KEY.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new SupabaseError(`Supabase ${table} insert failed (${res.status}): ${await res.text()}`, res.status);
  }
}

/** Call a database function, e.g. supabaseRpc("host_get_requests", { p_session_id, p_host_key }). */
export async function supabaseRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabaseConfigured) throw new Error("Supabase isn't set up: add SUPABASE_URL and SUPABASE_ANON_KEY.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new SupabaseError(`Supabase ${fn} failed (${res.status}): ${await res.text()}`, res.status);
  }
  return res.json();
}
