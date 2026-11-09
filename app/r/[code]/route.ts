// Short session links: /r/bbd716fa → /run/bbd716fa-69b3-4b3d-9e28-cce4ba04e8d6
// The code is the first 8 characters of the session id, so links are easy to type and share.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseSelect } from "@/lib/supabase";

const CODE_RE = /^[0-9a-f]{8}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  // A code that matches no session goes to the home page (a non-id /run/ link would show the demo run).
  const notFound = new URL("/", request.url);
  if (!CODE_RE.test(code) || !supabaseConfigured) return NextResponse.redirect(notFound);

  // Every session id that starts with these 8 characters falls in this range.
  const from = `${code}-0000-0000-0000-000000000000`;
  const to = `${code}-ffff-ffff-ffff-ffffffffffff`;
  try {
    const rows = await supabaseSelect<{ id: string }>(
      "sessions",
      `id=gte.${from}&id=lte.${to}&select=id&limit=2`,
    );
    // Exactly one match: go to it. None (or, very rarely, two): show the not-found page.
    if (rows.length === 1) return NextResponse.redirect(new URL(`/run/${rows[0].id}`, request.url));
  } catch (err) {
    console.error("[Runex] Short link lookup failed:", err);
  }
  return NextResponse.redirect(notFound);
}
