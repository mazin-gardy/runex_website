// Adds someone to the Runex updates list (the `subscribers` table in Supabase).
// The public key can only add to this table, never read it, so the list stays private.

import { SupabaseError, supabaseInsert } from "./supabase";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Saves an email. Someone already on the list counts as a success. Throws if Supabase fails. */
export async function addSubscriber(email: string, firstName: string | null, source: string) {
  try {
    await supabaseInsert("subscribers", {
      email: email.trim().toLowerCase().slice(0, 200),
      first_name: firstName?.trim().slice(0, 60) || null,
      source: source.slice(0, 100),
    });
  } catch (err) {
    if (err instanceof SupabaseError && err.status === 409) return; // already signed up
    throw err;
  }
}
