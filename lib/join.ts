"use server";

// Saves a join request from the website into Supabase (session_members),
// the same way the app does: as "pending", for the host to approve.

import { revalidatePath } from "next/cache";
import { supabaseInsert, supabaseSelect } from "./supabase";
import { APPROVED_STATUSES, UUID_RE } from "./sessions";
import { EMAIL_RE, addSubscriber } from "./subscribers";

const REQUEST_STATUS = "pending";

export type JoinState =
  | { status: "idle" }
  | { status: "requested"; name: string }
  | { status: "full" }
  | { status: "error"; message: string; values?: { name: string; contact: string; updates: boolean } };

export async function joinSession(sessionId: string, _prev: JoinState, formData: FormData): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const contact = String(formData.get("contact") ?? "").trim().slice(0, 120);
  const wantsUpdates = formData.get("updates") === "on";

  // Sent back with errors so the form keeps what they typed.
  const values = { name, contact, updates: wantsUpdates };

  if (!name) return { status: "error", message: "Add your first name so the host knows who's coming.", values };
  if (contact && !EMAIL_RE.test(contact) && !/^\+?[\d\s()-]{6,}$/.test(contact)) {
    return { status: "error", message: "That doesn't look like an email or phone number.", values };
  }
  if (wantsUpdates && !EMAIL_RE.test(contact)) {
    return { status: "error", message: "Add your email above to get Runex updates, or untick the box.", values };
  }

  // The demo session isn't in the database: pretend it worked.
  if (!UUID_RE.test(sessionId)) return { status: "requested", name };

  try {
    // Don't take requests when the run is already full.
    const [session] = await supabaseSelect<{ max_capacity: number | null }>(
      "sessions",
      `id=eq.${sessionId}&select=max_capacity&limit=1`,
    );
    if (!session) return { status: "error", message: "This run doesn't exist anymore." };
    if (session.max_capacity && session.max_capacity > 0) {
      const approved = await supabaseSelect<{ id: string }>(
        "session_members",
        `session_id=eq.${sessionId}&status=in.(${APPROVED_STATUSES.join(",")})&select=id`,
      );
      if (approved.length >= session.max_capacity) return { status: "full" };
    }

    await supabaseInsert("session_members", {
      session_id: sessionId,
      name,
      contact: contact || null,
      status: REQUEST_STATUS,
      member_device_id: "web",
    });
  } catch (err) {
    console.error("[Runex] Join request failed:", err);
    return { status: "error", message: "Couldn't send your request right now. Please try again in a moment.", values };
  }

  // Only if they ticked the box. A failure here shouldn't undo their join request.
  if (wantsUpdates) {
    await addSubscriber(contact, name, `join:${sessionId}`).catch((err) =>
      console.error("[Runex] Updates sign-up from join failed:", err),
    );
  }

  revalidatePath(`/run/${sessionId}`);
  return { status: "requested", name };
}
