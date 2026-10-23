import type { Metadata } from "next";
import Link from "next/link";
import RouteMap from "@/components/RouteMap";
import { getSession } from "@/lib/sessions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession(id);
  const description = `${session.dateLabel} · ${session.startTime} · ${session.distanceKm} km. Move together.`;

  return {
    title: `${session.title} · Runex`,
    description,
    // Hidden page: only reachable from a shared link, never from search.
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    openGraph: {
      title: `Join ${session.title} on Runex`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Join ${session.title} on Runex`,
      description,
    },
  };
}

export default async function RunSessionPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession(id);

  return (
    <main
      className="min-h-dvh text-black"
      style={{ background: "var(--share-bg)", fontFamily: "var(--share-font)" }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-32 pt-8 md:pb-12">
        <header>
          <p className="text-xl font-black tracking-tight">RUNEX</p>
        </header>

        <h1 className="mt-12 text-center text-[clamp(2.25rem,11vw,3.25rem)] font-black uppercase leading-[0.95] tracking-tight [text-wrap:balance]">
          {session.title}
        </h1>

        <RouteMap
          route={session.route}
          startLabel={session.startLabel}
          className="mt-8 aspect-[10/9] w-full"
        />

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Date" value={session.dateLabel} detail={session.startTime} />
          <Stat label="Distance" value={`${session.distanceKm} km`} align="center" />
          <Stat label="Sport" value={session.sport} align="right" />
        </dl>

        {/* Join: pinned to the bottom of the screen on phones, inline on larger screens. */}
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[var(--share-bg)] from-60% to-transparent px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:static md:mt-auto md:bg-none md:px-0 md:pb-0 md:pt-12">
          <Link
            href="/#join"
            className="mx-auto flex h-14 w-full max-w-[432px] items-center justify-center rounded-full bg-black text-lg font-bold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            // Inline so the global `a { color: inherit; font: inherit }` rules in globals.css can't override them.
            style={{ color: "var(--share-bg)", fontSize: 18, fontWeight: 700 }}
          >
            Join
          </Link>
        </div>
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
