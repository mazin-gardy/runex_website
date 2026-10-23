// Placeholder session data until sessions come from the backend (e.g. Supabase).
// Every /run/<id> currently resolves to the demo session.

export type LngLat = [number, number]; // [longitude, latitude]

export type RunSession = {
  id: string;
  title: string;
  dateLabel: string; // e.g. "Sat 24 Oct"
  startTime: string; // e.g. "6:45am"
  distanceKm: number;
  sport: string;
  pace: string;
  host: { name: string; initials: string };
  going: number;
  startLabel: string;
  route: LngLat[];
};

// The Tan loop, Melbourne (drawn by hand in geojson.io, approximate).
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

const DEMO_SESSION: Omit<RunSession, "id"> = {
  title: "Tan Loop",
  dateLabel: "Sat 24 Oct",
  startTime: "6:45am",
  distanceKm: 3.8,
  sport: "Running",
  pace: "5:20 / km",
  host: { name: "Mira K.", initials: "MK" },
  going: 12,
  startLabel: "Start · Tan Track",
  route: TAN_LOOP,
};

export async function getSession(id: string): Promise<RunSession> {
  // TODO: load the real session by id from the backend; return null → notFound() when missing.
  return { id, ...DEMO_SESSION };
}
