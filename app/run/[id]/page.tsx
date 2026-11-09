import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GoingList from "@/components/GoingList";
import JoinPanel from "@/components/JoinPanel";
import RouteMap from "@/components/RouteMap";
import { getSession } from "@/lib/sessions";

type Props = { params: Promise<{ id: string }> };

// Load each session once per request, even though both the metadata and the page need it.
const loadSession = cache(getSession);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await loadSession(id);
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  if (!session) return { title: "Run not found · Runex", robots };

  const description = [
    session.dateLabel,
    session.startTime,
    session.distanceKm != null ? `${session.distanceKm} km` : null,
    `${session.going} going`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${session.title} · Runex`,
    description: `${description}. Move together.`,
    // Hidden page: only reachable from a shared link, never from search.
    robots,
    openGraph: { title: `Join ${session.title} on Runex`, description, type: "website" },
    twitter: { card: "summary_large_image", title: `Join ${session.title} on Runex`, description },
  };
}

export default async function RunSessionPage({ params }: Props) {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session) notFound();

  const isFull = session.maxCapacity != null && session.going >= session.maxCapacity;

  return (
    <main className="min-h-dvh text-black" style={{ background: "var(--share-bg)", fontFamily: "var(--share-font)" }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-32 pt-8 md:pb-12">
        <header>
          <p className="text-xl font-black tracking-tight">RUNEX</p>
        </header>

        <h1 className="mt-12 text-center text-[clamp(2.25rem,11vw,3.25rem)] font-black uppercase leading-[0.95] tracking-tight [text-wrap:balance]">
          {session.title}
        </h1>

        {session.route.length > 0 && (
          <RouteMap route={session.route} startLabel={session.startLabel} className="mt-8 aspect-[10/9] w-full" />
        )}

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Date" value={session.dateLabel} detail={session.startTime} />
          <Stat
            label="Distance"
            value={session.distanceKm != null ? `${session.distanceKm} km` : "–"}
            detail={session.pace ?? undefined}
            align="center"
          />
          <Stat label="Sport" value={session.sport} detail={session.vibe ?? undefined} align="right" />
        </dl>

        {session.description && <p className="mt-6 text-base leading-relaxed">{session.description}</p>}

        <GoingList
          members={session.members}
          going={session.going}
          pending={session.pending}
          maxCapacity={session.maxCapacity}
          hostName={session.host.name}
        />

        <JoinPanel
          sessionId={session.id}
          isFull={isFull}
          dateLabel={session.dateLabel}
          startTime={session.startTime}
          locationName={session.locationName}
        />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  detail,
  align = "left",
}: {
  label: string;
  value: string;
  detail?: string;
  align?: "left" | "center" | "right";
}) {
  const alignment = { left: "text-left", center: "text-center", right: "text-right" }[align];
  return (
    <div className={alignment}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</dt>
      <dd className="mt-1 text-lg font-bold leading-tight">{value}</dd>
      {detail && <dd className="text-sm font-semibold opacity-70">{detail}</dd>}
    </div>
  );
}
