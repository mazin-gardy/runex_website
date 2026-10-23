import { ImageResponse } from "next/og";
import { getSession } from "@/lib/sessions";

export const alt = "Runex running session";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(family: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`;
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\((https:[^)]+)\)\s*format/);
  if (!match) throw new Error(`Could not resolve font URL for ${family} ${weight}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [medium, bold] = await Promise.all([
    loadGoogleFont("Inter", 500),
    loadGoogleFont("Inter", 800),
  ]);

  // Same data as the session page, so the preview always matches it.
  const session = await getSession(id);
  const words = session.title.toUpperCase().split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const date = session.dateLabel.toUpperCase();
  const startTime = session.startTime.toUpperCase();
  const titleLine1 = words.slice(0, half).join(" ");
  const titleLine2 = words.slice(half).join(" ");
  const distance = String(session.distanceKm);
  const pace = session.pace.toUpperCase();
  const host = session.host.name.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ADED2B", // keep in sync with --share-bg in globals.css
          color: "#000",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "Inter",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 6,
            fontWeight: 500,
          }}
        >
          <span style={{ fontWeight: 800 }}>RUNEX</span>
          <span>Session · {id}</span>
        </div>

        {/* DATE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
            fontSize: 22,
            letterSpacing: 5,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <span>{date}</span>
          <span style={{ margin: "0 18px" }}>·</span>
          <span>Start {startTime}</span>
        </div>

        {/* TITLE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
            fontSize: 150,
            lineHeight: 0.9,
            letterSpacing: -6,
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          <span>{titleLine1}</span>
          <span>{titleLine2}</span>
        </div>

        {/* STATS ROW */}
        <div style={{ display: "flex", gap: 20, marginTop: "auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 28,
              borderRadius: 20,
              background: "#fff",
              width: 300,
              height: 160,
            }}
          >
            <span
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Distance
            </span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 82, fontWeight: 800, letterSpacing: -3 }}>
                {distance}
              </span>
              <span style={{ fontSize: 26, marginLeft: 10, fontWeight: 500 }}>
                km
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 28,
              borderRadius: 20,
              background: "#000",
              color: "#fff",
              width: 340,
              height: 160,
            }}
          >
            <span
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: 0.7,
                fontWeight: 500,
              }}
            >
              Pace
            </span>
            <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: -2 }}>
              {pace}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 28,
              borderRadius: 20,
              background: "#fff",
              flex: 1,
              height: 160,
            }}
          >
            <span
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Hosted by
            </span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 999,
                  background: "#000",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  marginRight: 16,
                }}
              >
                MK
              </div>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
                {host}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: medium, style: "normal", weight: 500 },
        { name: "Inter", data: bold, style: "normal", weight: 800 },
      ],
    },
  );
}
