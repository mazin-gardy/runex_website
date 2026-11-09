"use client";

import { useActionState, useId } from "react";
import { subscribe, type SubscribeState } from "@/lib/subscribe";

/** "Get Runex updates" email sign-up, used in the homepage's last section. */
export default function UpdatesForm() {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(subscribe.bind(null, "homepage"), {
    status: "idle",
  });
  const emailId = useId();
  const nameId = useId();

  if (state.status === "subscribed") {
    return (
      <div className="max-w-md" role="status">
        <p className="text-2xl font-semibold tracking-tight">You&apos;re on the list.</p>
        <p className="mt-2 text-base">
          We&apos;ll email {state.email} about new runs, café events and the app launch.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-md">
      <p className="text-xs uppercase tracking-[0.2em]">Get Runex updates</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={nameId} className="sr-only">
          First name (optional)
        </label>
        <input
          id={nameId}
          name="firstName"
          placeholder="First name"
          autoComplete="given-name"
          maxLength={60}
          className="h-12 rounded-full border border-black/30 bg-white/60 px-5 outline-none placeholder:text-black/50 focus:border-black sm:w-36"
          style={{ fontSize: 16 }}
        />
        <label htmlFor={emailId} className="sr-only">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
          maxLength={200}
          className="h-12 w-full min-w-0 rounded-full sm:flex-1 border border-black/30 bg-white/60 px-5 outline-none placeholder:text-black/50 focus:border-black"
          style={{ fontSize: 16 }}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-12 w-full rounded-full bg-black px-7 text-white transition-transform duration-300 enabled:hover:scale-[1.02] disabled:opacity-60"
        style={{ fontSize: 15, fontWeight: 600 }}
      >
        {pending ? "Signing up…" : "Keep me posted"}
      </button>
      <p className="mt-3 text-xs text-black/60">
        New runs, café events and the app launch. No spam, unsubscribe any time.
      </p>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
