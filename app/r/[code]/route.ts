// Short session links.
//   /r/wheels-run-club → the session whose slug is "wheels-run-club" (see supabase/session-slugs.sql)
//   /r/bbd716fa        → the session whose id starts with those 8 characters (older links keep working)

import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseSelect } from "@/lib/supabase";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_PREFIX_RE = /^[0-9a-f]{8}$/;

async function findBySlug(slug: string): Promise<string | null> {
  try {
    const rows = await supabaseSelect<{ id: string }>(
      "sessions",
      `slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    // Before session-slugs.sql has been run, the slug column doesn't exist yet.
    console.error("[Runex] Slug lookup failed:", err);
    return null;
  }
}

async function findByIdPrefix(code: string): Promise<string | null> {
  // Every session id that starts with these 8 characters falls in this range.
  const from = `${code}-0000-0000-0000-000000000000`;
  const to = `${code}-ffff-ffff-ffff-ffffffffffff`;
  try {
    const rows = await supabaseSelect<{ id: string }>(
      "sessions",
      `id=gte.${from}&id=lte.${to}&select=id&limit=2`,
    );
    return rows.length === 1 ? rows[0].id : null; // none, or (very rarely) two: no match
  } catch (err) {
    console.error("[Runex] Short link lookup failed:", err);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).toLowerCase().slice(0, 80);
  // A link that matches no session goes to the home page (a non-id /run/ link would show the demo run).
  const notFound = NextResponse.redirect(new URL("/", request.url));
  if (!supabaseConfigured || !SLUG_RE.test(code)) return notFound;

  const id = (await findBySlug(code)) ?? (ID_PREFIX_RE.test(code) ? await findByIdPrefix(code) : null);
  return id ? NextResponse.redirect(new URL(`/run/${id}`, request.url)) : notFound;
}
