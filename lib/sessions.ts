// Loads a run session (and who's going) from Supabase, in the shape the session page needs.
// Links that aren't a real session id (e.g. /run/demo-001) show the demo session.

import { supabaseConfigured, supabaseSelect } from "./supabase";

export type LngLat = [number, number]; // [longitude, latitude]

export type Member = { name: string; initials: string; avatarUrl: string | null };

export type RunSession = {
  id: string;
  isDemo: boolean;
  title: string;
  dateLabel: string; // e.g. "Sat 24 Oct"
  startTime: string; // e.g. "6:45am"
  distanceKm: number | null;
  sport: string;
  pace: string | null;
  vibe: string | null;
  description: string | null;
  locationName: string | null;
  host: { name: string; initials: string };
  going: number; // approved
  pending: number; // waiting for the host to approve
  maxCapacity: number | null;
  members: Member[];
  startLabel: string;
  route: LngLat[]; // a drawn route, or just the meeting point
};

// Join requests start as "pending"; the host then approves them in the app.
// Any of these statuses counts as going.
export const APPROVED_STATUSES = ["approved", "accepted", "joined", "going", "confirmed"];
const APPROVED = new Set(APPROVED_STATUSES);

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SessionRow = {
  id: string;
  title: string | null;
  sport_type: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string | null;
  description: string | null;
  host_name: string | null;
  vibe: string | null;
  date: string | null;
  time: string | null;
  distance_km: number | string | null;
  pace: string | null;
  max_capacity: number | null;
  current_count: number | null;
  route: unknown;
};

type MemberRow = { name: string | null; member_avatar_url: string | null; status: string | null };

// Only public fields. host_contact, member contacts and device ids are never loaded here.
const SESSION_FIELDS =
  "id,title,sport_type,location_name,latitude,longitude,start_time,description,host_name,vibe,date,time,distance_km,pace,max_capacity,current_count,route";

export async function getSession(id: string): Promise<RunSession | null> {
  if (!UUID_RE.test(id) || !supabaseConfigured) return { ...DEMO_SESSION, id };

  const rows = await supabaseSelect<SessionRow>("sessions", `id=eq.${id}&select=${SESSION_FIELDS}&limit=1`);
  const row = rows[0];
  if (!row) return null;

  let members: Member[] = [];
  let going = row.current_count ?? 0;
  let pending = 0;
  try {
    const memberRows = await supabaseSelect<MemberRow>(
      "session_members",
      `session_id=eq.${id}&select=name,member_avatar_url,status&order=created_at.asc`,
    );
    const status = (m: MemberRow) => (m.status ?? "").toLowerCase();
    const approved = memberRows.filter((m) => APPROVED.has(status(m)));
    members = approved.map((m) => toMember(m.name, m.member_avatar_url));
    going = approved.length;
    pending = memberRows.filter((m) => status(m) === "pending").length;
  } catch (err) {
    console.error("[Runex] Couldn't load who's going:", err);
  }

  const route = normaliseRoute(row.route);
  const meetingPoint: LngLat[] =
    row.longitude != null && row.latitude != null ? [[row.longitude, row.latitude]] : [];
  const distance = row.distance_km == null ? null : Number(row.distance_km);
  const hostName = firstName(row.host_name) || "Runex runner";

  return {
    id,
    isDemo: false,
    title: row.title?.trim() || "Group run",
    dateLabel: formatDate(row.date, row.start_time),
    startTime: formatTime(row.time, row.start_time),
    distanceKm: distance != null && Number.isFinite(distance) ? Math.round(distance * 100) / 100 : null,
    sport: capitalise(row.sport_type) || "Running",
    pace: row.pace?.trim() || null,
    vibe: row.vibe?.trim() || null,
    description: row.description?.trim() || null,
    locationName: row.location_name?.trim() || null,
    host: { name: hostName, initials: initials(hostName) },
    going,
    pending,
    maxCapacity: row.max_capacity && row.max_capacity > 0 ? row.max_capacity : null,
    members,
    startLabel: row.location_name ? `Start · ${row.location_name}` : "Start",
    route: route.length ? route : meetingPoint,
  };
}

// --- formatting --------------------------------------------------------------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Reads "2026-10-24", "2026-10-24T06:45:00" or similar as the local date and time written in it. */
function wallClock(value: string | null) {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] != null ? +m[4] : null, mi: m[5] != null ? +m[5] : null };
}

function formatDate(date: string | null, startTime: string | null) {
  const parsed = wallClock(date) ?? wallClock(startTime);
  if (parsed) {
    const day = new Date(Date.UTC(parsed.y, parsed.mo - 1, parsed.d)).getUTCDay();
    return `${DAYS[day]} ${parsed.d} ${MONTHS[parsed.mo - 1]}`;
  }
  return date?.trim() || "Date to be confirmed";
}

function formatTime(time: string | null, startTime: string | null) {
  const m = time?.match(/^(\d{1,2}):(\d{2})/);
  if (m) return twelveHour(+m[1], +m[2]);
  if (time?.trim()) return time.trim();
  const parsed = wallClock(startTime);
  if (parsed?.h != null && parsed.mi != null) return twelveHour(parsed.h, parsed.mi);
  return "";
}

function twelveHour(h: number, mi: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(mi).padStart(2, "0")}${suffix}`;
}

function firstName(name: string | null) {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();
}

function capitalise(text: string | null) {
  const t = (text ?? "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

/** Show only a first name publicly. */
function toMember(name: string | null, avatarUrl: string | null): Member {
  const first = firstName(name) || "Runner";
  return { name: first, initials: initials(first), avatarUrl: avatarUrl || null };
}

// --- routes ------------------------------------------------------------------

/**
 * Accepts the route in whatever shape the app saved it:
 * GeoJSON (LineString / Feature / FeatureCollection), [[lng, lat], …], [[lat, lng], …],
 * or [{ latitude, longitude }, …] / [{ lat, lng }, …].
 */
export function normaliseRoute(value: unknown): LngLat[] {
  let data = value;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (!data) return [];

  if (typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
      for (const f of obj.features) {
        const r = normaliseRoute(f);
        if (r.length) return r;
      }
      return [];
    }
    if (obj.type === "Feature") return normaliseRoute(obj.geometry);
    if (obj.type === "MultiLineString" && Array.isArray(obj.coordinates)) return normaliseRoute(obj.coordinates.flat());
    if (Array.isArray(obj.coordinates)) return normaliseRoute(obj.coordinates);
    if (Array.isArray(obj.points)) return normaliseRoute(obj.points);
    return [];
  }

  if (!Array.isArray(data)) return [];
  const points: LngLat[] = [];
  for (const p of data) {
    if (Array.isArray(p) && p.length >= 2) {
      const a = Number(p[0]);
      const b = Number(p[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      // GeoJSON order is [lng, lat]. If the first number can only be a latitude, swap.
      points.push(Math.abs(a) <= 90 && Math.abs(b) > 90 ? [b, a] : [a, b]);
    } else if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      const lat = Number(o.latitude ?? o.lat);
      const lng = Number(o.longitude ?? o.lng ?? o.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lng, lat]);
    }
  }
  return points.filter(([lng, lat]) => Math.abs(lng) <= 180 && Math.abs(lat) <= 90);
}

// --- demo --------------------------------------------------------------------

// The Tan loop, Melbourne (drawn by hand, approximate).
const TAN_LOOP: LngLat[] = [
  [144.9705, -37.8236],
  [144.9716, -37.825],
  [144.9725, -37.8268],
  [144.9727, -37.83],
  [144.9728, -37.8326],
  [144.976, -37.8331],
  [144.98, -37.8336],
  [144.9836, -37.8341],
  [144.984, -37.831],
  [144.9845, -37.8272],
  [144.981, -37.8253],
  [144.9775, -37.8236],
  [144.9745, -37.8222],
  [144.9722, -37.8218],
  [144.971, -37.8224],
  [144.9705, -37.8236],
];

const DEMO_MEMBERS = ["Mira", "Sam", "Priya", "Jordan", "Alex", "Tom", "Lena", "Kai"].map((n) => toMember(n, null));

const DEMO_SESSION: RunSession = {
  id: "demo-001",
  isDemo: true,
  title: "Tan Loop",
  dateLabel: "Sat 24 Oct",
  startTime: "6:45am",
  distanceKm: 3.8,
  sport: "Running",
  pace: "5:20 / km",
  vibe: null,
  description: null,
  locationName: "Tan Track",
  host: { name: "Mira", initials: "M" },
  going: DEMO_MEMBERS.length,
  pending: 2,
  maxCapacity: 12,
  members: DEMO_MEMBERS,
  startLabel: "Start · Tan Track",
  route: TAN_LOOP,
};
