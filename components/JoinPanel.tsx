"use client";

import { useActionState, useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinSession, type JoinState } from "@/lib/join";

type Props = {
  sessionId: string;
  isFull: boolean;
  dateLabel: string;
  startTime: string;
  locationName: string | null;
};

const LIME = "var(--share-bg)";
// Inline sizes: globals.css sets `button, a { font: inherit }`, which would override text utilities.
const BIG_TEXT = { fontSize: 18, fontWeight: 700 } as const;

// Reads the name saved on this phone when someone asks to join (browser only; nothing on the server).
function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readSaved(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage unavailable
  }
}

export default function JoinPanel({ sessionId, isFull, dateLabel, startTime, locationName }: Props) {
  const router = useRouter();
  const storageKey = `runex-joined-${sessionId}`;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinSession.bind(null, sessionId),
    { status: "idle" },
  );
  const nameId = useId();
  const contactId = useId();

  // Remember on this phone that you've asked to join, so the button says so next time.
  const savedName = useSyncExternalStore(subscribeToStorage, () => readSaved(storageKey), () => null);
  const joinedAs = state.status === "requested" ? state.name : savedName;
  // What they typed, sent back with an error so the form isn't wiped.
  const values = state.status === "error" ? state.values : undefined;

  useEffect(() => {
    if (state.status !== "requested") return;
    try {
      localStorage.setItem(storageKey, state.name);
    } catch {
      /* storage unavailable */
    }
    router.refresh(); // update the "waiting for approval" count
  }, [state, storageKey, router]);

  const when = [dateLabel, startTime].filter(Boolean).join(" at ");

  return (
    <>
      {/* Join: pinned to the bottom of the screen on phones, inline on larger screens. */}
      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--share-bg)] from-60% to-transparent px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:static md:mt-auto md:bg-none md:px-0 md:pb-0 md:pt-10">
        {joinedAs ? (
          <div
            className="mx-auto flex h-14 w-full max-w-[432px] items-center justify-center gap-2 rounded-full border-2 border-black"
            style={BIG_TEXT}
          >
            <span aria-hidden="true">✓</span> Request sent, {joinedAs}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={isFull}
            className="mx-auto flex h-14 w-full max-w-[432px] items-center justify-center rounded-full bg-black transition-transform duration-200 enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-50"
            style={{ ...BIG_TEXT, color: LIME }}
          >
            {isFull ? "This run is full" : "Request to join"}
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${nameId}-title`}
            className="w-full max-w-[480px] rounded-t-[28px] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-black shadow-2xl md:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            {state.status === "requested" ? (
              <div className="flex flex-col gap-3 py-2">
                <p id={`${nameId}-title`} className="text-3xl font-black uppercase leading-none tracking-tight">
                  Request sent, {state.name}!
                </p>
                <p className="text-base">
                  The host will confirm your spot for {when}
                  {locationName ? ` at ${locationName}` : ""}. Get the app to see when you&apos;re approved.
                </p>
                <Link
                  href="/#join"
                  className="mt-3 flex h-14 items-center justify-center rounded-full bg-black"
                  style={{ ...BIG_TEXT, color: LIME }}
                >
                  Get the Runex app
                </Link>
                <button type="button" onClick={() => setOpen(false)} className="h-12 rounded-full" style={{ fontWeight: 600 }}>
                  Done
                </button>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p id={`${nameId}-title`} className="text-2xl font-black uppercase leading-none tracking-tight">
                      Request to join
                    </p>
                    {when && <p className="mt-1 text-sm opacity-70">{when}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5"
                    style={{ fontSize: 20 }}
                  >
                    ×
                  </button>
                </div>

                <label htmlFor={nameId} className="flex flex-col gap-1 text-sm font-semibold">
                  First name
                  <input
                    id={nameId}
                    name="name"
                    required
                    defaultValue={values?.name}
                    maxLength={40}
                    autoComplete="given-name"
                    className="h-12 rounded-xl border border-black/15 px-4 outline-none focus:border-black"
                    style={{ fontSize: 16, fontWeight: 400 }}
                  />
                </label>

                <label htmlFor={contactId} className="flex flex-col gap-1 text-sm font-semibold">
                  Email or phone <span className="font-normal opacity-60">(optional, so the host can reach you)</span>
                  <input
                    id={contactId}
                    name="contact"
                    defaultValue={values?.contact}
                    maxLength={120}
                    autoComplete="email"
                    className="h-12 rounded-xl border border-black/15 px-4 outline-none focus:border-black"
                    style={{ fontSize: 16, fontWeight: 400 }}
                  />
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="updates"
                    defaultChecked={values?.updates}
                    className="mt-0.5 h-5 w-5 accent-black"
                  />
                  <span>
                    Email me Runex updates: new runs, café events and the app launch.{" "}
                    <span className="opacity-60">Needs an email above. Unsubscribe any time.</span>
                  </span>
                </label>

                <p className="text-xs opacity-60">Only your first name is shown on this page.</p>

                {state.status === "error" && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.message}
                  </p>
                )}
                {state.status === "full" && (
                  <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Sorry, this run just filled up.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-14 items-center justify-center rounded-full bg-black disabled:opacity-60"
                  style={{ ...BIG_TEXT, color: LIME }}
                >
                  {pending ? "Sending…" : "Send request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
