// export async function geocodeLocation(location) {
//   if (!location) return { lat: null, lng: null };

//   try {
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
//         location
//       )}&format=json&limit=1`
//     );

//     const data = await res.json();
//     if (data.length === 0) return { lat: null, lng: null };

//     return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
//   } catch (error) {
//     console.error("❌ Geocoding failed:", error);
//     return { lat: null, lng: null };
//   }
// }
// app/lib/utils/geocode.js
const CACHE = new Map();

/**
 * geocodeLocation(address)
 * returns { lat: number, lng: number } or null
 */
export async function geocodeLocation(address) {
  if (!address || typeof address !== "string") return null;
  const key = address.trim().toLowerCase();
  if (CACHE.has(key)) return CACHE.get(key);

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Monastery360/1.0 (contact@yourdomain.com)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      console.warn("geocode request failed status:", res.status);
      return null;
    }

    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      // no result
      return null;
    }

    const first = arr[0];
    if (!first.lat || !first.lon) return null;

    const result = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    CACHE.set(key, result);
    if (CACHE.size > 500) {
      // prune oldest
      const k = CACHE.keys().next().value;
      CACHE.delete(k);
    }
    return result;
  } catch (err) {
    console.error("geocodeLocation error:", err);
    return null;
  }
}
