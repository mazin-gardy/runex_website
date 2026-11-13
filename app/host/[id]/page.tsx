import type { Metadata } from "next";
import HostPanel from "@/components/HostPanel";

// Private page for the host of a run: /host/<session id>#<host key>.
// The key sits after the # so it is never sent in the page request or kept in server logs.

export const metadata: Metadata = {
  title: "Host · Runex",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-dvh text-black" style={{ background: "var(--share-bg)", fontFamily: "var(--share-font)" }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <p className="text-xl font-black tracking-tight">RUNEX</p>
          <p className="rounded-full bg-black px-3 py-1 text-xs font-bold text-[var(--share-bg)]">HOST</p>
        </header>
        <HostPanel sessionId={id} />
      </div>
    </main>
  );
}
