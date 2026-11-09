import type { Member } from "@/lib/sessions";

type Props = {
  members: Member[];
  going: number;
  pending: number;
  maxCapacity: number | null;
  hostName: string;
};

const SHOWN = 5;

/** "12 going · 4 spots left" with a row of avatars, plus who's hosting. */
export default function GoingList({ members, going, pending, maxCapacity, hostName }: Props) {
  const shown = members.slice(0, SHOWN);
  const extra = Math.max(0, going - shown.length);
  const spotsLeft = maxCapacity != null ? Math.max(0, maxCapacity - going) : null;

  return (
    <section className="mt-8 flex flex-col gap-3 border-t-2 border-black pt-5" aria-label="Who's going">
      <div className="flex items-center gap-3">
        {shown.length > 0 && (
          <div className="flex -space-x-2.5" aria-hidden="true">
            {shown.map((m, i) =>
              m.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatars come from many hosts
                <img
                  key={i}
                  src={m.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--share-bg)]"
                />
              ) : (
                <span
                  key={i}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-2 ring-[var(--share-bg)] ${
                    i % 2 ? "bg-white text-black" : "bg-black text-[var(--share-bg)]"
                  }`}
                >
                  {m.initials}
                </span>
              ),
            )}
            {extra > 0 && (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-black ring-2 ring-[var(--share-bg)]">
                +{extra}
              </span>
            )}
          </div>
        )}
        <p className="text-base font-bold leading-tight">
          {going > 0 ? `${going} going` : "Be the first to join"}
          {spotsLeft != null && (
            <span className="block text-sm font-semibold opacity-70">
              {spotsLeft === 0 ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
            </span>
          )}
        </p>
      </div>
      {shown.length > 0 && (
        <p className="sr-only">Going: {members.map((m) => m.name).join(", ")}</p>
      )}
      <p className="text-sm">
        Hosted by <span className="font-bold">{hostName}</span>
        {pending > 0 && (
          <span className="opacity-70">
            {" · "}
            {pending} waiting for approval
          </span>
        )}
      </p>
    </section>
  );
}
