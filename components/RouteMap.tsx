"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type LngLat = [number, number];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mazingardy/cmtsj7utr00ms01sq6bs106pv";
const DRAW_DURATION_MS = 1500;

// Same look as the route in the Runex app.
const HALO_COLOR = "#C9A214";
const HALO_EDGE = "#8F7310";
const LINE_COLOR = "#0B0B0B";
const RING_COLOR = "#C6E86B";

type Props = {
  route: LngLat[];
  startLabel?: string;
  /** Host photo for the start marker; a person placeholder is shown without one. */
  hostAvatarUrl?: string | null;
  className?: string;
};

export default function RouteMap({ route, startLabel = "Start", hostAvatarUrl = null, className = "" }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  // Only load Mapbox once the card is close to the screen, so the page opens fast.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !mapRef.current || route.length < 1) return;
    if (!MAPBOX_TOKEN) {
      console.warn(
        "[Runex map] No NEXT_PUBLIC_MAPBOX_TOKEN in this build. Add it to .env.local (local) or Vercel → Settings → Environment Variables, then rebuild.",
      );
      return;
    }

    let map: MapboxMap | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let frame = 0;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const hasLine = route.length > 1;
      const bounds = route.reduce(
        (b, point) => b.extend(point),
        new mapboxgl.LngLatBounds(route[0], route[0]),
      );

      map = new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        // A drawn route: fit it in the card. Only a meeting point: zoom in on it.
        ...(hasLine ? { bounds, fitBoundsOptions: { padding: 56 } } : { center: route[0], zoom: 15 }),
        cooperativeGestures: true, // two fingers to move the map, so page scrolling never gets stuck
        attributionControl: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      // Keep the map filling the card when the page or card changes size.
      resizeObserver = new ResizeObserver(() => map?.resize());
      resizeObserver.observe(mapRef.current);
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("error", (event) => {
        console.error("[Runex map] Mapbox error:", event.error?.message ?? event);
        if (!map?.loaded()) setMapFailed(true);
      });

      map.on("load", () => {
        if (!map) return;

        setMapReady(true);
        if (hasLine) {
          map.addSource("route", { type: "geojson", data: lineFeature(route.slice(0, 1)) });
          const layout = { "line-cap": "round", "line-join": "round" } as const;
          // Thick gold band with a darker edge, and the black route line on top.
          map.addLayer({ id: "route-halo-edge", type: "line", source: "route", layout,
            paint: { "line-color": HALO_EDGE, "line-width": 20, "line-opacity": 0.55 } });
          map.addLayer({ id: "route-halo", type: "line", source: "route", layout,
            paint: { "line-color": HALO_COLOR, "line-width": 17 } });
          map.addLayer({ id: "route-line", type: "line", source: "route", layout,
            paint: { "line-color": LINE_COLOR, "line-width": 5 } });
        }

        // Host photo in a lime ring, sitting on the start of the route.
        new mapboxgl.Marker({ element: startMarker(startLabel, hostAvatarUrl), anchor: "center" })
          .setLngLat(route[0])
          .addTo(map);
        if (!hasLine) return; // only a meeting point, no route to draw

        // Draw the route in, unless the viewer prefers reduced motion.
        const source = map.getSource("route") as GeoJSONSource | undefined;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!source) return;
        if (reduceMotion) {
          source.setData(lineFeature(route));
          return;
        }
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DRAW_DURATION_MS);
          source.setData(lineFeature(partialRoute(route, easeInOut(t))));
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      });
    })().catch((err) => {
      console.error("[Runex map] Could not start the map:", err);
      setMapFailed(true);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      map?.remove();
    };
  }, [inView, route, startLabel, hostAvatarUrl]);

  const showStatic = !mapReady || mapFailed;

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden rounded-[28px] bg-[#eef1e6] ${className}`}
    >
      {/* Static route drawing: shown instantly, and kept if the live map can't load. */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${showStatic ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!showStatic}
      >
        <StaticRoute route={route} startLabel={startLabel} hostAvatarUrl={hostAvatarUrl} />
        {!MAPBOX_TOKEN && process.env.NODE_ENV !== "production" && (
          <p className="absolute inset-x-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs text-black">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to show the live map.
          </p>
        )}
      </div>

      {/* Live Mapbox map. Position is set inline because Mapbox's own CSS sets the map to position: relative. */}
      <div
        ref={mapRef}
        className={`transition-opacity duration-500 ${mapReady && !mapFailed ? "opacity-100" : "opacity-0"}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        role="region"
        aria-label="Interactive map of the run route"
      />
    </div>
  );
}

function StaticRoute({
  route,
  startLabel,
  hostAvatarUrl,
}: {
  route: LngLat[];
  startLabel: string;
  hostAvatarUrl: string | null;
}) {
  const width = 400;
  const height = 360;
  const pad = 48;
  const { points } = projectRoute(route, width, height, pad);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [sx, sy] = points[0] ?? [0, 0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Map of the run route"
    >
      <defs>
        <pattern id="route-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#route-grid)" />
      <title>{startLabel}</title>
      {points.length > 1 && (
        <>
          <path d={d} fill="none" stroke={HALO_EDGE} strokeOpacity="0.55" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={HALO_COLOR} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={LINE_COLOR} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      <defs>
        <clipPath id="start-avatar">
          <circle cx={sx} cy={sy} r="21" />
        </clipPath>
      </defs>
      <circle cx={sx} cy={sy} r="32" fill={RING_COLOR} opacity="0.45" />
      <circle cx={sx} cy={sy} r="26" fill={RING_COLOR} />
      <circle cx={sx} cy={sy} r="21" fill="#8E8E93" />
      {hostAvatarUrl ? (
        <image href={hostAvatarUrl} x={sx - 21} y={sy - 21} width="42" height="42" clipPath="url(#start-avatar)" preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g clipPath="url(#start-avatar)" fill="#000">
          <circle cx={sx} cy={sy - 6} r="8" />
          <ellipse cx={sx} cy={sy + 16} rx="15" ry="11" />
        </g>
      )}
    </svg>
  );
}

// --- helpers ---------------------------------------------------------------

type LineFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "LineString"; coordinates: LngLat[] };
};

function lineFeature(coords: LngLat[]): LineFeature {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** The first `fraction` (0–1) of the route by length, ending on an interpolated point. */
function partialRoute(route: LngLat[], fraction: number): LngLat[] {
  if (fraction >= 1) return route;
  const lengths = route.slice(1).map((p, i) => segmentLength(route[i], p));
  const target = lengths.reduce((a, b) => a + b, 0) * fraction;
  const out: LngLat[] = [route[0]];
  let travelled = 0;
  for (let i = 0; i < lengths.length; i++) {
    const next = travelled + lengths[i];
    if (next >= target) {
      const f = lengths[i] === 0 ? 0 : (target - travelled) / lengths[i];
      const [x1, y1] = route[i];
      const [x2, y2] = route[i + 1];
      out.push([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]);
      return out;
    }
    out.push(route[i + 1]);
    travelled = next;
  }
  return out;
}

function segmentLength([x1, y1]: LngLat, [x2, y2]: LngLat) {
  const k = Math.cos((((y1 + y2) / 2) * Math.PI) / 180);
  return Math.hypot((x2 - x1) * k, y2 - y1);
}

/** Fit lng/lat points into an SVG box, keeping real-world proportions. */
function projectRoute(route: LngLat[], width: number, height: number, pad: number) {
  const lats = route.map((p) => p[1]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const xs = route.map((p) => p[0] * k);
  const ys = route.map((p) => -p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return {
    points: route.map((_, i) => [offX + (xs[i] - minX) * scale, offY + (ys[i] - minY) * scale] as const),
  };
}

function startMarker(label: string, avatarUrl: string | null) {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.style.cssText = [
    "width:56px;height:56px;border-radius:50%;box-sizing:border-box;pointer-events:none",
    `border:5px solid ${RING_COLOR}`,
    `box-shadow:0 0 0 6px ${RING_COLOR}73,0 2px 8px rgba(0,0,0,.25)`,
    "background:#8E8E93;overflow:hidden;display:grid;place-items:center",
  ].join(";");
  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover";
    el.append(img);
  } else {
    // Person placeholder, like the app shows when the host has no photo.
    el.innerHTML =
      '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="17" r="8" fill="#000"/><ellipse cx="23" cy="40" rx="15" ry="11" fill="#000"/></svg>';
  }
  return el;
}
