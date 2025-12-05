// app/api/directions/route.js
import { NextResponse } from "next/server";

/** haversine distance in meters */
function haversine([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** estimate duration in seconds */
function estimateDurationMeters(distanceMeters, profile) {
  const speeds = { driving: 16.6667, walking: 1.3889, cycling: 4.1667 };
  const speed = speeds[profile] || speeds.driving;
  return Math.round(distanceMeters / speed);
}

function toNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n)) return n;
  return null;
}

/** Map friendly profile -> ORS profile id */
function mapToORSProfile(profile) {
  const p = (profile || "driving").toString().toLowerCase();
  const map = {
    driving: "driving-car",
    driving_car: "driving-car",
    drivingcar: "driving-car",
    walking: "foot-walking",
    foot: "foot-walking",
    cycling: "cycling-regular",
    bike: "cycling-regular",
  };
  return map[p] || "driving-car"; // default
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log("POST /api/directions body:", JSON.stringify(body));

    const from = body?.from;
    const to = body?.to;
    const profileFriendly = (body?.profile || "driving").toString();

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing 'from' or 'to' in request body. Example: { from:{lat:..,lng:..}, to:{lat:..,lng:..}, profile:'driving' }" },
        { status: 400 }
      );
    }

    const fromLat = toNumber(from.lat);
    const fromLng = toNumber(from.lng);
    const toLat = toNumber(to.lat);
    const toLng = toNumber(to.lng);

    if ([fromLat, fromLng, toLat, toLng].some((v) => v === null)) {
      return NextResponse.json({ error: "Invalid coordinate values. Ensure lat/lng are numbers." }, { status: 400 });
    }

    // Map friendly profile to ORS identifier
    const orsProfile = mapToORSProfile(profileFriendly);

    // If ORS key present, call it
    const ORS_KEY = process.env.ORS_API_KEY || process.env.OPENROUTE_API_KEY;
    if (ORS_KEY) {
      try {
        const url = `https://api.openrouteservice.org/v2/directions/${encodeURIComponent(orsProfile)}/geojson`;
        console.log("Calling ORS with profile:", orsProfile);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: ORS_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [fromLng, fromLat],
              [toLng, toLat],
            ],
          }),
        });

        const text = await res.text().catch(() => null);
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }

        if (!res.ok) {
          // return ORS body and status to client for clearer debugging
          console.error("ORS error:", { status: res.status, body: data ?? text });
          return NextResponse.json(
            { error: "ORS error", status: res.status, detail: data ?? text ?? `HTTP ${res.status}` },
            { status: 502 }
          );
        }

        // OK from ORS: return it
        return NextResponse.json(data ?? text);
      } catch (e) {
        console.warn("ORS call failed:", e);
        // continue to fallback below
      }
    }

    // Fallback straight-line geojson + summary
    const dist = Math.round(haversine([fromLat, fromLng], [toLat, toLng]));
    const duration = estimateDurationMeters(dist, profileFriendly);

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            summary: { distance: dist, duration },
            segments: [
              {
                distance: dist,
                duration,
                steps: [
                  { instruction: "Head towards destination (straight line fallback)", distance: dist, duration },
                ],
              },
            ],
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [fromLng, fromLat],
              [toLng, toLat],
            ],
          },
        },
      ],
    };

    return NextResponse.json(geojson);
  } catch (err) {
    console.error("POST /api/directions unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
