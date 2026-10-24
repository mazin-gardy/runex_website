"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type LngLat = [number, number];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mazingardy/cmtsj7utr00ms01sq6bs106pv";
const DRAW_DURATION_MS = 1500;

type Props = {
  route: LngLat[];
  startLabel?: string;
  className?: string;
};

export default function RouteMap({ route, startLabel = "Start", className = "" }: Props) {
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
    if (!inView || !mapRef.current || route.length < 2) return;
    if (!MAPBOX_TOKEN) {
      console.warn(
        "[Runex map] No NEXT_PUBLIC_MAPBOX_TOKEN in this build. Add it to .env.local (local) or Vercel → Settings → Environment Variables, then rebuild.",
      );
      return;
    }

    let map: MapboxMap | undefined;
    let frame = 0;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const bounds = route.reduce(
        (b, point) => b.extend(point),
        new mapboxgl.LngLatBounds(route[0], route[0]),
      );

      map = new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        bounds,
        fitBoundsOptions: { padding: 36 },
        cooperativeGestures: true, // two fingers to move the map, so page scrolling never gets stuck
        attributionControl: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("error", (event) => {
        console.error("[Runex map] Mapbox error:", event.error?.message ?? event);
        if (!map?.loaded()) setMapFailed(true);
      });

      map.on("load", () => {
        if (!map) return;

        map.addSource("route", { type: "geojson", data: lineFeature(route.slice(0, 1)) });
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#000000", "line-width": 5 },
        });

        new mapboxgl.Marker({ element: startMarker(startLabel), anchor: "left", offset: [-9, 0] })
          .setLngLat(route[0])
          .addTo(map);

        setMapReady(true);

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
      map?.remove();
    };
  }, [inView, route, startLabel]);

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
        <StaticRoute route={route} startLabel={startLabel} />
        {!MAPBOX_TOKEN && process.env.NODE_ENV !== "production" && (
          <p className="absolute inset-x-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs text-black">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to show the live map.
          </p>
        )}
      </div>

      {/* Live Mapbox map. */}
      <div
        ref={mapRef}
        className={`absolute inset-0 transition-opacity duration-500 ${mapReady && !mapFailed ? "opacity-100" : "opacity-0"}`}
        role="region"
        aria-label="Interactive map of the run route"
      />
    </div>
  );
}

function StaticRoute({ route, startLabel }: { route: LngLat[]; startLabel: string }) {
  const width = 400;
  const height = 360;
  const pad = 40;
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
      <path d={d} fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx} cy={sy} r="8" fill="#ADED2B" stroke="#000" strokeWidth="3" />
      <text x={sx + 14} y={sy + 4} fontSize="12" fontWeight="700" fill="#000">
        {startLabel}
      </text>
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

function startMarker(label: string) {
  const el = document.createElement("div");
  el.style.cssText =
    "display:flex;align-items:center;gap:6px;pointer-events:none;font:700 12px -apple-system,system-ui,sans-serif;color:#000";
  const dot = document.createElement("span");
  dot.style.cssText =
    "width:18px;height:18px;border-radius:50%;background:#ADED2B;border:3px solid #000;box-sizing:border-box";
  const text = document.createElement("span");
  text.textContent = label;
  text.style.cssText = "background:#fff;padding:3px 8px;border-radius:999px;box-shadow:0 1px 3px rgba(0,0,0,.2)";
  el.append(dot, text);
  return el;
}
