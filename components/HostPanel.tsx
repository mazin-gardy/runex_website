"use client";

import { useCallback, useEffect, useState } from "react";
import { decideRequest, loadHostRequests, type HostRequest, type HostResult, type HostView } from "@/lib/host";

const GOING = new Set(["approved", "accepted", "joined", "going", "confirmed"]);
const statusOf = (r: HostRequest) => (r.status ?? "").toLowerCase();

/** The secret host key is the part of the link after "#". */
const readHostKey = () => window.location.hash.replace(/^#/, "").trim();

/** The host's list of join requests, with Accept / Decline on each. */
export default function HostPanel({ sessionId }: { sessionId: string }) {
  const [view, setView] = useState<HostView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((result: HostResult) => {
    if (result.ok) {
      setView(result.view);
      setError(null);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadHostRequests(sessionId, readHostKey()).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, apply]);

  async function refresh() {
    apply(await loadHostRequests(sessionId, readHostKey()));
  }

  async function decide(memberId: string, status: "approved" | "declined" | "pending") {
    setBusyId(memberId);
    const result = await decideRequest(sessionId, readHostKey(), memberId, status);
    apply(result);
    setBusyId(null);
  }

  if (loading) return <p className="mt-16 text-center text-base font-semibold">Loading requests…</p>;

  if (!view) {
    return (
      <div className="mt-16 text-center">
        <h1 className="text-3xl font-black uppercase leading-none">Can&apos;t open this</h1>
        <p className="mt-4 text-base">{error}</p>
      </div>
    );
  }

  const pending = view.requests.filter((r) => statusOf(r) === "pending");
  const going = view.requests.filter((r) => GOING.has(statusOf(r)));
  const declined = view.requests.filter((r) => statusOf(r) === "declined");
  const spotsLeft = view.max_capacity && view.max_capacity > 0 ? Math.max(0, view.max_capacity - going.length) : null;

  return (
    <>
      <h1 className="mt-10 text-[clamp(2rem,9vw,2.75rem)] font-black uppercase leading-[0.95] tracking-tight [text-wrap:balance]">
        {view.title?.trim() || "Group run"}
      </h1>
      <p className="mt-3 text-base font-bold">
        {going.length} going
        {spotsLeft != null && <span className="opacity-70"> · {spotsLeft === 0 ? "full" : `${spotsLeft} spots left`}</span>}
        <span className="opacity-70"> · {pending.length} waiting</span>
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
          {error}
        </p>
      )}

      <Section title="Waiting for you" empty="No new requests right now.">
        {pending.map((r) => (
          <Row key={r.id} request={r}>
            <button
              type="button"
              disabled={busyId === r.id || spotsLeft === 0}
              onClick={() => decide(r.id, "approved")}
              className="min-h-11 flex-1 rounded-full bg-black px-4 text-sm font-bold text-[var(--share-bg)] disabled:opacity-50"
            >
              {busyId === r.id ? "Saving…" : "Accept"}
            </button>
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "declined")}
              className="min-h-11 flex-1 rounded-full border-2 border-black px-4 text-sm font-bold disabled:opacity-50"
            >
              Decline
            </button>
          </Row>
        ))}
      </Section>

      <Section title="Going" empty="Nobody accepted yet.">
        {going.map((r) => (
          <Row key={r.id} request={r}>
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => decide(r.id, "declined")}
              className="min-h-11 rounded-full border-2 border-black px-4 text-sm font-bold disabled:opacity-50"
            >
              {busyId === r.id ? "Saving…" : "Remove"}
            </button>
          </Row>
        ))}
      </Section>

      {declined.length > 0 && (
        <Section title="Declined" empty="">
          {declined.map((r) => (
            <Row key={r.id} request={r}>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, "pending")}
                className="min-h-11 rounded-full border-2 border-black px-4 text-sm font-bold disabled:opacity-50"
              >
                {busyId === r.id ? "Saving…" : "Undo"}
              </button>
            </Row>
          ))}
        </Section>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => refresh()}
          className="min-h-12 rounded-full border-2 border-black text-sm font-bold"
        >
          Check for new requests
        </button>
        <a href={`/run/${sessionId}`} className="text-center text-sm font-bold underline">
          View the public page
        </a>
        <p className="text-center text-xs opacity-70">
          This link is only for you. Anyone who has it can accept or decline requests.
        </p>
      </div>
    </>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <section className="mt-8 border-t-2 border-black pt-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm opacity-70">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

function Row({ request, children }: { request: HostRequest; children: React.ReactNode }) {
  const when = new Date(request.created_at).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <li className="rounded-3xl bg-white/60 p-4">
      <p className="text-lg font-bold leading-tight">{request.name?.trim() || "Someone"}</p>
      <p className="mt-0.5 text-sm opacity-70">
        {request.contact?.trim() || "No contact given"} · {when}
      </p>
      <div className="mt-3 flex gap-2">{children}</div>
    </li>
  );
}
