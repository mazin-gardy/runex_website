"use server";

// Form action for the "Get Runex updates" form.

import { supabaseConfigured } from "./supabase";
import { EMAIL_RE, addSubscriber } from "./subscribers";

export type SubscribeState =
  | { status: "idle" }
  | { status: "subscribed"; email: string }
  | { status: "error"; message: string };

export async function subscribe(source: string, _prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();

  if (!EMAIL_RE.test(email)) return { status: "error", message: "Please enter a valid email address." };
  if (!supabaseConfigured) return { status: "error", message: "Sign-ups aren't switched on yet. Please try again soon." };

  try {
    await addSubscriber(email, firstName || null, source === "homepage" ? "homepage" : "website");
  } catch (err) {
    console.error("[Runex] Sign-up failed:", err);
    return { status: "error", message: "Couldn't sign you up right now. Please try again in a moment." };
  }
  return { status: "subscribed", email };
}
