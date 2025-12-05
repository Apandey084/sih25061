// // "use client";

// // import { useEffect, useState, useRef } from "react";
// // import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
// // import "leaflet/dist/leaflet.css";
// // import L from "leaflet";

// // // ✅ Fix default marker icons for Leaflet in Next.js
// // delete L.Icon.Default.prototype._getIconUrl;
// // L.Icon.Default.mergeOptions({
// //   iconRetinaUrl: "/leaflet/marker-icon-2x.png",
// //   iconUrl: "/leaflet/marker-icon.png",
// //   shadowUrl: "/leaflet/marker-shadow.png",
// // });

// // // ✅ Safe center hook
// // function CenterMap({ center }) {
// //   const map = useMap();
// //   useEffect(() => {
// //     if (
// //       center &&
// //       Array.isArray(center) &&
// //       center.length === 2 &&
// //       center.every((c) => typeof c === "number" && !isNaN(c))
// //     ) {
// //       map.setView(center, map.getZoom(), { animate: true });
// //     }
// //   }, [center, map]);
// //   return null;
// // }

// // export default function MapClient() {
// //   const [monasteries, setMonasteries] = useState([]);
// //   const [selected, setSelected] = useState(null);
// //   const [userLoc, setUserLoc] = useState(null);
// //   const [profile, setProfile] = useState("driving");
// //   const [routeGeo, setRouteGeo] = useState(null);
// //   const [summary, setSummary] = useState(null);
// //   const [loadingRoute, setLoadingRoute] = useState(false);
// //   const mapRef = useRef(null);

// //   // ✅ Fetch monasteries
// //   useEffect(() => {
// //     async function fetchData() {
// //       try {
// //         const res = await fetch("/api/monasteries");
// //         const data = await res.json();
// //         setMonasteries(Array.isArray(data) ? data : []);
// //       } catch (err) {
// //         console.error("Fetch monasteries error", err);
// //       }
// //     }
// //     fetchData();
// //   }, []);

// //   // ✅ Get user location
// //   const requestUserLocation = () =>
// //     new Promise((resolve, reject) => {
// //       if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
// //       navigator.geolocation.getCurrentPosition(
// //         (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
// //         (e) => reject(e),
// //         { enableHighAccuracy: true, timeout: 10000 }
// //       );
// //     });

// //   // ✅ Handle Get Directions
// //   async function handleGetDirections(monastery) {
// //     if (!monastery?.lat || !monastery?.lng) {
// //       alert("No coordinates found for this monastery.");
// //       return;
// //     }

// //     setSelected(monastery);
// //     setRouteGeo(null);
// //     setSummary(null);
// //     setLoadingRoute(true);

// //     let from;
// //     try {
// //       from = userLoc || (await requestUserLocation());
// //       setUserLoc(from);
// //     } catch {
// //       alert("Could not get your location. Using default center (India).");
// //       from = { lat: 20.5937, lng: 78.9629 };
// //     }

// //     const to = { lat: monastery.lat, lng: monastery.lng };

// //     try {
// //       const res = await fetch("/api/directions", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ from, to, profile }),
// //       });

// //       const data = await res.json();
// //       if (!res.ok) throw new Error(data?.error?.message || data?.error || "Failed to get route");

// //       const coordsArr = data?.features?.[0]?.geometry?.coordinates || [];
// //       const latlngs = coordsArr.map((c) => [c[1], c[0]]);
// //       setRouteGeo(latlngs);

// //       const feature = data?.features?.[0];
// //       const summaryObj = feature?.properties?.summary;
// //       const steps = feature?.properties?.segments?.[0]?.steps || [];

// //       setSummary(summaryObj ? { distance: summaryObj.distance, duration: summaryObj.duration, steps } : null);

// //       if (latlngs.length) {
// //         const mid = latlngs[Math.floor(latlngs.length / 2)];
// //         mapRef.current?.setView(mid, 13);
// //       }
// //     } catch (err) {
// //       console.error("Route fetch failed", err);
// //       alert("Failed to fetch route.");
// //     } finally {
// //       setLoadingRoute(false);
// //     }
// //   }

// //   // ✅ Formatters
// //   const formatDist = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m");
// //   const formatTime = (s) => {
// //     if (s == null) return "";
// //     const mins = Math.round(s / 60);
// //     if (mins < 60) return mins + " min";
// //     const hrs = Math.floor(mins / 60);
// //     const rem = mins % 60;
// //     return `${hrs} h ${rem} min`;
// //   };

// //   return (
// //     <div className="h-screen w-full flex flex-col md:flex-row">
// //       {/* Left side: Map */}
// //       <div className="flex-1 h-1/2 md:h-full">
// //         <MapContainer
// //           center={[20.5937, 78.9629]}
// //           zoom={5}
// //           style={{ height: "100%", width: "100%" }}
// //           whenCreated={(map) => (mapRef.current = map)}
// //         >
// //           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
// //           <CenterMap center={selected ? [selected.lat, selected.lng] : null} />

// //           {/* User marker */}
// //           {userLoc && (
// //             <Marker position={[userLoc.lat, userLoc.lng]}>
// //               <Popup>Your location</Popup>
// //             </Marker>
// //           )}

// //           {/* Monastery markers */}
// //           {monasteries.map((m) => {
// //             if (!m.lat || !m.lng) return null;
// //             const pos = [m.lat, m.lng];
// //             return (
// //               <Marker key={m._id} position={pos}>
// //                 <Popup>
// //                   <div className="min-w-[180px]">
// //                     <div className="font-semibold">{m.name}</div>
// //                     <div className="text-sm text-gray-600">{m.location}</div>
// //                     <div className="mt-2 flex flex-wrap gap-2">
// //                       <button
// //                         className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
// //                         onClick={() => (window.location.href = `/viewer?tourFor=${m._id}`)}
// //                       >
// //                         View VR
// //                       </button>
// //                       <button
// //                         className="bg-green-600 text-white px-2 py-1 rounded text-sm"
// //                         onClick={() => handleGetDirections(m)}
// //                       >
// //                         Get Directions
// //                       </button>
// //                       <a
// //                         className="bg-gray-200 px-2 py-1 rounded text-sm"
// //                         href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
// //                         target="_blank"
// //                         rel="noreferrer"
// //                       >
// //                         Open in Google Maps
// //                       </a>
// //                     </div>
// //                   </div>
// //                 </Popup>
// //               </Marker>
// //             );
// //           })}

// //           {/* Route polyline */}
// //           {routeGeo && <Polyline positions={routeGeo} pathOptions={{ color: "#1976d2", weight: 6 }} />}
// //         </MapContainer>
// //       </div>

// //       {/* Right side: list + directions */}
// //       <div className="w-full md:w-96 border-t md:border-t-0 md:border-l p-4 space-y-4 bg-white overflow-auto">
// //         <div className="flex items-center justify-between">
// //           <h2 className="text-lg font-semibold">Monasteries</h2>
// //           <div className="flex gap-2 items-center">
// //             <select
// //               value={profile}
// //               onChange={(e) => setProfile(e.target.value)}
// //               className="border rounded px-2 py-1 text-sm"
// //             >
// //               <option value="driving">Drive</option>
// //               <option value="walking">Walk</option>
// //               <option value="cycling">Cycle</option>
// //             </select>
// //             <button
// //               onClick={() =>
// //                 requestUserLocation()
// //                   .then((loc) => setUserLoc(loc))
// //                   .catch(() => alert("Allow location access to use this feature"))
// //               }
// //               className="bg-slate-700 text-white px-3 py-1 rounded text-sm"
// //             >
// //               Locate Me
// //             </button>
// //           </div>
// //         </div>

// //         {summary && (
// //           <div className="p-2 bg-gray-50 rounded text-sm space-y-2">
// //             <div className="font-medium text-gray-800">Route Summary</div>
// //             <div className="text-gray-600">
// //               {formatDist(summary.distance)} — {formatTime(summary.duration)}
// //             </div>
// //             {summary.steps?.length > 0 && (
// //               <div className="max-h-64 overflow-y-auto border-t pt-2">
// //                 <div className="text-xs font-medium text-gray-700 mb-1">Turn-by-turn:</div>
// //                 <ol className="space-y-1 text-gray-700 text-sm">
// //                   {summary.steps.map((step, i) => (
// //                     <li key={i} className="border-l-2 border-gray-300 pl-2">
// //                       <span className="block">
// //                         {i + 1}. {step.instruction}
// //                       </span>
// //                       <span className="text-xs text-gray-500">
// //                         {formatDist(step.distance)} — {formatTime(step.duration)}
// //                       </span>
// //                     </li>
// //                   ))}
// //                 </ol>
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* Monastery cards */}
// //         <div className="space-y-2">
// //           {monasteries.length === 0 && <div>No monasteries loaded.</div>}
// //           {monasteries.map((m) => (
// //             <div key={m._id} className="p-3 border rounded flex items-center gap-3">
// //               <div className="flex-1">
// //                 <div className="font-semibold">{m.name}</div>
// //                 {m.location && <div className="text-xs text-gray-500">{m.location}</div>}
// //               </div>
// //               <div className="flex flex-col gap-1">
// //                 {m.lat && m.lng ? (
// //                   <>
// //                     <button
// //                       className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
// //                       onClick={() => {
// //                         setSelected(m);
// //                         mapRef.current?.flyTo([m.lat, m.lng], 14, { duration: 0.6 });
// //                       }}
// //                     >
// //                       Go
// //                     </button>
// //                     <button
// //                       className="bg-green-600 text-white px-2 py-1 rounded text-xs"
// //                       onClick={() => handleGetDirections(m)}
// //                     >
// //                       Directions
// //                     </button>
// //                   </>
// //                 ) : (
// //                   <span className="text-[10px] text-gray-400 italic">No coordinates</span>
// //                 )}
// //               </div>
// //             </div>
// //           ))}
// //         </div>

// //         <div className="pt-4 text-xs text-gray-500">
// //           Tip: Click a marker to view actions. Toggle travel mode to recalc route.
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


// // app/map/MapClient.jsx
// "use client";

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
//   useMap,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// /**
//  * Ensure Leaflet marker icons are available.
//  * Try local /leaflet/... first; if missing, fallback to CDN.
//  */
// function useEnsureMarkerIcons() {
//   useEffect(() => {
//     const localBase = "/leaflet";
//     const candidates = {
//       iconRetinaUrl: `${localBase}/marker-icon-2x.png`,
//       iconUrl: `${localBase}/marker-icon.png`,
//       shadowUrl: `${localBase}/marker-shadow.png`,
//     };

//     let applied = false;

//     const check = async () => {
//       try {
//         // HEAD check for each resource
//         const checks = await Promise.all(
//           Object.values(candidates).map((url) =>
//             fetch(url, { method: "HEAD" }).then((r) => r.ok).catch(() => false)
//           )
//         );

//         const ok = checks.every(Boolean);
//         if (ok) {
//           L.Icon.Default.mergeOptions(candidates);
//           applied = true;
//           return;
//         }
//       } catch (e) {
//         // ignore
//       }

//       // Fallback CDN (reliable)
//       L.Icon.Default.mergeOptions({
//         iconRetinaUrl:
//           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
//         iconUrl:
//           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
//         shadowUrl:
//           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
//       });
//       applied = true;
//     };

//     check();

//     // no cleanup required
//   }, []);
// }

// /** CenterMap helper that safely sets view when center is valid */
// function CenterMap({ center }) {
//   const map = useMap();
//   useEffect(() => {
//     if (
//       center &&
//       Array.isArray(center) &&
//       center.length === 2 &&
//       center.every((c) => typeof c === "number" && !isNaN(c))
//     ) {
//       map.setView(center, map.getZoom(), { animate: true });
//     }
//   }, [center, map]);
//   return null;
// }

// /** request user location with proper promise API */
// function getUserLocation(options = { enableHighAccuracy: true, timeout: 10000 }) {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
//     navigator.geolocation.getCurrentPosition(
//       (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
//       (e) => reject(e),
//       options
//     );
//   });
// }

// export default function MapClient() {
//   useEnsureMarkerIcons();

//   const [monasteries, setMonasteries] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [userLoc, setUserLoc] = useState(null);
//   const [profile, setProfile] = useState("driving");
//   const [routeGeo, setRouteGeo] = useState(null);
//   const [summary, setSummary] = useState(null);
//   const [loadingRoute, setLoadingRoute] = useState(false);
//   const [loadingMonasteries, setLoadingMonasteries] = useState(true);

//   const mapRef = useRef(null);

//   // Fetch monasteries robustly
//   useEffect(() => {
//     let mounted = true;
//     (async function fetchData() {
//       try {
//         const res = await fetch("/api/monasteries");
//         const data = await res.json();

//         // Support various shapes: array or { monasteries: [...] } or { data: [...] }
//         let list = [];
//         if (Array.isArray(data)) list = data;
//         else if (Array.isArray(data?.monasteries)) list = data.monasteries;
//         else if (Array.isArray(data?.data)) list = data.data;
//         else {
//           console.warn("Unexpected monasteries API shape:", data);
//         }

//         if (mounted) setMonasteries(list);
//       } catch (err) {
//         console.error("Fetch monasteries error", err);
//         if (mounted) setMonasteries([]);
//       } finally {
//         if (mounted) setLoadingMonasteries(false);
//       }
//     })();
//     return () => (mounted = false);
//   }, []);

//   // Request user location and set state (exposed on UI)
//   const requestUserLocationAndSet = useCallback(async () => {
//     try {
//       const loc = await getUserLocation();
//       setUserLoc(loc);
//       if (mapRef.current) {
//         mapRef.current.flyTo([loc.lat, loc.lng], 13, { duration: 0.6 });
//       }
//     } catch (err) {
//       console.warn("User location request failed", err);
//       throw err;
//     }
//   }, []);

//   // Directions fetch - robust and tolerant to API shapes
//   async function handleGetDirections(monastery) {
//     if (!monastery?.lat || !monastery?.lng) {
//       alert("No coordinates found for this monastery.");
//       return;
//     }

//     setSelected(monastery);
//     setRouteGeo(null);
//     setSummary(null);
//     setLoadingRoute(true);

//     let from;
//     try {
//       from = userLoc || (await getUserLocation());
//       setUserLoc(from);
//     } catch {
//       // fallback default center (India)
//       from = { lat: 20.5937, lng: 78.9629 };
//     }

//     const to = { lat: monastery.lat, lng: monastery.lng };

//     try {
//       const res = await fetch("/api/directions", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ from, to, profile }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         console.error("Directions API error", data);
//         throw new Error(data?.error || data?.message || "Failed to get directions");
//       }

//       // Try to parse conventional GeoJSON style: features[0].geometry.coordinates -> [lng,lat,...]
//       const coordsArr = data?.features?.[0]?.geometry?.coordinates || data?.geometry?.coordinates || [];
//       const latlngs =
//         coordsArr.length && Array.isArray(coordsArr[0])
//           ? coordsArr.map((c) => [c[1], c[0]])
//           : // if API returned plain flat coords (unlikely) fallback
//             coordsArr;

//       setRouteGeo(latlngs);

//       // Extract summary info if present (distance in meters, duration in seconds)
//       const summaryObj = data?.features?.[0]?.properties?.summary || data?.properties?.summary || data?.summary;
//       const steps =
//         data?.features?.[0]?.properties?.segments?.[0]?.steps ||
//         data?.properties?.segments?.[0]?.steps ||
//         [];

//       setSummary(summaryObj ? { distance: summaryObj.distance, duration: summaryObj.duration, steps } : null);

//       if (latlngs.length && mapRef.current) {
//         const mid = latlngs[Math.floor(latlngs.length / 2)];
//         mapRef.current.setView(mid, 13);
//       }
//     } catch (err) {
//       console.error("Route fetch failed", err);
//       alert("Failed to fetch route. See console for details.");
//     } finally {
//       setLoadingRoute(false);
//     }
//   }

//   // small format helpers
//   const formatDist = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m");
//   const formatTime = (s) => {
//     if (s == null) return "";
//     const mins = Math.round(s / 60);
//     if (mins < 60) return mins + " min";
//     const hrs = Math.floor(mins / 60);
//     const rem = mins % 60;
//     return `${hrs} h ${rem} min`;
//   };

//   return (
//     <div className="h-screen w-full flex flex-col md:flex-row">
//       {/* Left side: Map */}
//       <div className="flex-1 h-1/2 md:h-full">
//         <MapContainer
//           center={[20.5937, 78.9629]}
//           zoom={5}
//           style={{ height: "100%", width: "100%" }}
//           whenCreated={(map) => (mapRef.current = map)}
//         >
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//           <CenterMap center={selected ? [selected.lat, selected.lng] : null} />

//           {/* User marker */}
//           {userLoc && (
//             <Marker position={[userLoc.lat, userLoc.lng]}>
//               <Popup>Your location</Popup>
//             </Marker>
//           )}

//           {/* Monastery markers */}
//           {!loadingMonasteries &&
//             monasteries.map((m) => {
//               if (!m?.lat || !m?.lng) return null;
//               const pos = [m.lat, m.lng];
//               return (
//                 <Marker key={m._id ?? m.id ?? `${m.name}-${m.lat}-${m.lng}`} position={pos}>
//                   <Popup>
//                     <div className="min-w-[180px]">
//                       <div className="font-semibold">{m.name}</div>
//                       <div className="text-sm text-gray-600">{m.location}</div>
//                       <div className="mt-2 flex flex-wrap gap-2">
//                         <button
//                           className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
//                           onClick={() => (window.location.href = `/viewer?tourFor=${m._id ?? m.id}`)}
//                         >
//                           View VR
//                         </button>
//                         <button
//                           className="bg-green-600 text-white px-2 py-1 rounded text-sm"
//                           onClick={() => handleGetDirections(m)}
//                         >
//                           Get Directions
//                         </button>
//                         <a
//                           className="bg-gray-200 px-2 py-1 rounded text-sm"
//                           href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
//                           target="_blank"
//                           rel="noreferrer"
//                         >
//                           Open in Google Maps
//                         </a>
//                       </div>
//                     </div>
//                   </Popup>
//                 </Marker>
//               );
//             })}

//           {/* Route polyline */}
//           {routeGeo && <Polyline positions={routeGeo} pathOptions={{ color: "#1976d2", weight: 6 }} />}
//         </MapContainer>
//       </div>

//       {/* Right side: list + directions */}
//       <div className="w-full md:w-96 border-t md:border-t-0 md:border-l p-4 space-y-4 bg-white overflow-auto">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold">Monasteries</h2>
//           <div className="flex gap-2 items-center">
//             <select value={profile} onChange={(e) => setProfile(e.target.value)} className="border rounded px-2 py-1 text-sm">
//               <option value="driving">Drive</option>
//               <option value="walking">Walk</option>
//               <option value="cycling">Cycle</option>
//             </select>
//             <button
//               onClick={() =>
//                 getUserLocation()
//                   .then((loc) => {
//                     setUserLoc(loc);
//                     mapRef.current?.flyTo([loc.lat, loc.lng], 13, { duration: 0.6 });
//                   })
//                   .catch(() => alert("Allow location access to use this feature"))
//               }
//               className="bg-slate-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Locate Me
//             </button>
//           </div>
//         </div>

//         {loadingRoute && <div className="text-sm">Loading route…</div>}

//         {summary && (
//           <div className="p-2 bg-gray-50 rounded text-sm space-y-2">
//             <div className="font-medium text-gray-800">Route Summary</div>
//             <div className="text-gray-600">
//               {formatDist(summary.distance)} — {formatTime(summary.duration)}
//             </div>
//             {summary.steps?.length > 0 && (
//               <div className="max-h-64 overflow-y-auto border-t pt-2">
//                 <div className="text-xs font-medium text-gray-700 mb-1">Turn-by-turn:</div>
//                 <ol className="space-y-1 text-gray-700 text-sm">
//                   {summary.steps.map((step, i) => (
//                     <li key={i} className="border-l-2 border-gray-300 pl-2">
//                       <span className="block">
//                         {i + 1}. {step.instruction || step.name || step.description}
//                       </span>
//                       <span className="text-xs text-gray-500">
//                         {formatDist(step.distance)} — {formatTime(step.duration)}
//                       </span>
//                     </li>
//                   ))}
//                 </ol>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Monastery cards */}
//         <div className="space-y-2">
//           {loadingMonasteries && <div>Loading monasteries…</div>}
//           {!loadingMonasteries && monasteries.length === 0 && <div>No monasteries loaded.</div>}
//           {monasteries.map((m) => (
//             <div key={m._id ?? m.id ?? `${m.name}-${m.lat}-${m.lng}`} className="p-3 border rounded flex items-center gap-3">
//               <div className="flex-1">
//                 <div className="font-semibold">{m.name}</div>
//                 {m.location && <div className="text-xs text-gray-500">{m.location}</div>}
//               </div>
//               <div className="flex flex-col gap-1">
//                 {m.lat && m.lng ? (
//                   <>
//                     <button
//                       className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
//                       onClick={() => {
//                         setSelected(m);
//                         mapRef.current?.flyTo([m.lat, m.lng], 14, { duration: 0.6 });
//                       }}
//                     >
//                       Go
//                     </button>
//                     <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleGetDirections(m)}>
//                       Directions
//                     </button>
//                   </>
//                 ) : (
//                   <span className="text-[10px] text-gray-400 italic">No coordinates</span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="pt-4 text-xs text-gray-500">
//           Tip: Click a marker to view actions. Toggle travel mode to recalc route.
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Ensure leaflet marker images exist (try local then CDN) */
function useEnsureMarkerIcons() {
  useEffect(() => {
    const localBase = "/leaflet";
    const localCandidates = {
      iconRetinaUrl: `${localBase}/marker-icon-2x.png`,
      iconUrl: `${localBase}/marker-icon.png`,
      shadowUrl: `${localBase}/marker-shadow.png`,
    };

    const tryApplyLocal = async () => {
      try {
        const ok = await Promise.all(
          Object.values(localCandidates).map(u => fetch(u, { method: "HEAD" }).then(r => r.ok).catch(() => false))
        ).then(arr => arr.every(Boolean));
        if (ok) {
          L.Icon.Default.mergeOptions(localCandidates);
          return;
        }
      } catch {}
      // fallback CDN
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    };
    tryApplyLocal();
  }, []);
}

function CenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center.every(c => typeof c === "number" && !isNaN(c))) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

function getUserLocation(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      e => reject(e),
      options
    );
  });
}

export default function MapClient() {
  useEnsureMarkerIcons();
  const [monasteries, setMonasteries] = useState([]);
  const [loadingMonasteries, setLoadingMonasteries] = useState(true);
  const [selected, setSelected] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [profile, setProfile] = useState("driving");
  const [routeGeo, setRouteGeo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/monasteries");
        const data = await res.json();

        // derive array from API response shapes
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.monasteries)) list = data.monasteries;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (data?.monastery && typeof data.monastery === "object") list = [data.monastery];
        else list = [];

        // normalizer: map many possible field names to lat/lng numbers
        function pickCoord(m) {
          const candLat =
            m?.lat ??
            m?.locationLat ??
            m?.location?.lat ??
            m?.coordinates?.lat ??
            (m?.coordinates && (m.coordinates[0] || m.coordinates?.lat));
          const candLng =
            m?.lng ??
            m?.locationLng ??
            m?.location?.lng ??
            m?.coordinates?.lng ??
            (m?.coordinates && (m.coordinates[1] || m.coordinates?.lng));

          const lat = candLat != null ? Number(candLat) : undefined;
          const lng = candLng != null ? Number(candLng) : undefined;

          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
          return null;
        }

        const normalized = list.map(m => {
          const coords = pickCoord(m);
          return {
            ...m,
            lat: coords?.lat ?? (m.lat !== undefined ? Number(m.lat) : undefined),
            lng: coords?.lng ?? (m.lng !== undefined ? Number(m.lng) : undefined),
            coordinates: coords ? { lat: coords.lat, lng: coords.lng } : m.coordinates,
          };
        });

        if (mounted) setMonasteries(normalized);
      } catch (err) {
        console.error("Fetch monasteries error", err);
        if (mounted) setMonasteries([]);
      } finally {
        if (mounted) setLoadingMonasteries(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  async function handleGetDirections(monastery) {
    if (!Number.isFinite(Number(monastery?.lat)) || !Number.isFinite(Number(monastery?.lng))) {
      alert("No coordinates found for this monastery.");
      return;
    }

    setSelected(monastery);
    setRouteGeo(null);
    setSummary(null);
    setLoadingRoute(true);

    let from;
    try {
      from = userLoc || (await getUserLocation());
      setUserLoc(from);
    } catch {
      from = { lat: 20.5937, lng: 78.9629 };
    }

    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: { lat: Number(monastery.lat), lng: Number(monastery.lng) }, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Directions failed");

      const coordsArr = data?.features?.[0]?.geometry?.coordinates || data?.geometry?.coordinates || [];
      const latlngs = coordsArr.length && Array.isArray(coordsArr[0]) ? coordsArr.map(c => [c[1], c[0]]) : coordsArr;
      setRouteGeo(latlngs);

      const summaryObj = data?.features?.[0]?.properties?.summary || data?.properties?.summary || data?.summary;
      const steps = data?.features?.[0]?.properties?.segments?.[0]?.steps || [];
      setSummary(summaryObj ? { distance: summaryObj.distance, duration: summaryObj.duration, steps } : null);

      if (latlngs.length && mapRef.current) {
        const mid = latlngs[Math.floor(latlngs.length / 2)];
        mapRef.current.setView(mid, 13);
      }
    } catch (err) {
      console.error("Route fetch failed", err);
      alert("Failed to fetch route. See console.");
    } finally {
      setLoadingRoute(false);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 h-1/2 md:h-full">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }} whenCreated={map => (mapRef.current = map)}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CenterMap center={selected ? [selected.lat, selected.lng] : null} />

          {userLoc && <Marker position={[userLoc.lat, userLoc.lng]}><Popup>Your location</Popup></Marker>}

          {!loadingMonasteries &&
            monasteries.map(m => {
              if (!Number.isFinite(Number(m.lat)) || !Number.isFinite(Number(m.lng))) return null;
              const pos = [Number(m.lat), Number(m.lng)];
              return (
                <Marker key={m._id ?? m.id ?? `${m.name}-${m.lat}-${m.lng}`} position={pos}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-sm text-gray-600">{m.location}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button className="bg-blue-600 text-white px-2 py-1 rounded text-sm" onClick={() => (window.location.href = `/viewer?tourFor=${m._id ?? m.id}`)}>View VR</button>
                        <button className="bg-green-600 text-white px-2 py-1 rounded text-sm" onClick={() => handleGetDirections(m)}>Get Directions</button>
                        <a className="bg-gray-200 px-2 py-1 rounded text-sm" href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {routeGeo && <Polyline positions={routeGeo} pathOptions={{ color: "#1976d2", weight: 6 }} />}
        </MapContainer>
      </div>

      <div className="w-full md:w-96 border-t md:border-t-0 md:border-l p-4 space-y-4 bg-white overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Monasteries</h2>
          <div className="flex gap-2 items-center">
            <select value={profile} onChange={(e) => setProfile(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="driving">Drive</option>
              <option value="walking">Walk</option>
              <option value="cycling">Cycle</option>
            </select>
            <button onClick={() => getUserLocation().then(loc => { setUserLoc(loc); mapRef.current?.flyTo([loc.lat, loc.lng], 13, { duration: 0.6 }); }).catch(()=>alert("Allow location access"))} className="bg-slate-700 text-white px-3 py-1 rounded text-sm">Locate Me</button>
          </div>
        </div>

        {loadingRoute && <div className="text-sm">Loading route…</div>}

        {summary && (
          <div className="p-2 bg-gray-50 rounded text-sm space-y-2">
            <div className="font-medium text-gray-800">Route Summary</div>
            <div className="text-gray-600">{summary.distance ? `${(summary.distance/1000).toFixed(1)} km` : ""} — {summary.duration ? Math.round(summary.duration/60) + " min" : ""}</div>
          </div>
        )}

        <div className="space-y-2">
          {loadingMonasteries && <div>Loading monasteries…</div>}
          {!loadingMonasteries && monasteries.length === 0 && <div>No monasteries loaded.</div>}
          {monasteries.map(m => {
            const hasCoords = Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng));
            return (
              <div key={m._id ?? m.id ?? m.name} className="p-3 border rounded flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{m.name}</div>
                  {m.location && <div className="text-xs text-gray-500">{m.location}</div>}
                </div>
                <div className="flex flex-col gap-1">
                  {hasCoords ? (
                    <>
                      <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => { setSelected(m); mapRef.current?.flyTo([Number(m.lat), Number(m.lng)], 14, { duration: 0.6 }); }}>Go</button>
                      <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleGetDirections(m)}>Directions</button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">No coordinates</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 text-xs text-gray-500">Tip: Click a marker to view actions. Toggle travel mode to recalc route.</div>
      </div>
    </div>
  );
}
