"use server";

// The host's side of join requests: list them, and accept or decline each one.
// Every call needs the session's secret host key (from the private host link);
// the database checks it, so nothing here works without it.

import { revalidatePath } from "next/cache";
import { SupabaseError, supabaseRpc } from "./supabase";
import { UUID_RE } from "./sessions";

export type HostRequest = {
  id: string;
  name: string | null;
  contact: string | null;
  status: string | null;
  created_at: string;
};

export type HostView = { title: string | null; max_capacity: number | null; requests: HostRequest[] };

export type HostResult = { ok: true; view: HostView } | { ok: false; message: string };

const KEY_RE = /^[0-9a-f]{32,128}$/i;
const BAD_LINK = "This host link isn't valid. Check you copied the whole link.";

function failure(err: unknown): HostResult {
  const text = err instanceof Error ? err.message : "";
  if (text.includes("invalid host link")) return { ok: false, message: BAD_LINK };
  if (text.includes("session is full")) return { ok: false, message: "This run is full. Decline someone first to free a spot." };
  if (text.includes("request not found")) return { ok: false, message: "That request no longer exists." };
  if (err instanceof SupabaseError && err.status === 404) {
    return { ok: false, message: "Host approvals aren't set up yet: run supabase/host-requests.sql in Supabase." };
  }
  console.error("[Runex] Host request failed:", err);
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

export async function loadHostRequests(sessionId: string, hostKey: string): Promise<HostResult> {
  if (!UUID_RE.test(sessionId) || !KEY_RE.test(hostKey)) return { ok: false, message: BAD_LINK };
  try {
    const view = await supabaseRpc<HostView | null>("host_get_requests", {
      p_session_id: sessionId,
      p_host_key: hostKey,
    });
    if (!view) return { ok: false, message: "This run doesn't exist anymore." };
    return { ok: true, view };
  } catch (err) {
    return failure(err);
  }
}

export async function decideRequest(
  sessionId: string,
  hostKey: string,
  memberId: string,
  status: "approved" | "declined" | "pending",
): Promise<HostResult> {
  if (!UUID_RE.test(sessionId) || !KEY_RE.test(hostKey) || !UUID_RE.test(memberId)) {
    return { ok: false, message: BAD_LINK };
  }
  try {
    const view = await supabaseRpc<HostView>("host_set_request", {
      p_session_id: sessionId,
      p_host_key: hostKey,
      p_member_id: memberId,
      p_status: status,
    });
    revalidatePath(`/run/${sessionId}`); // the public page shows the new going count
    return { ok: true, view };
  } catch (err) {
    return failure(err);
  }
}
