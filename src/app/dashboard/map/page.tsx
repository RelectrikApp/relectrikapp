"use client";

import { useState, useEffect, useRef } from "react";

// Google Maps se carga por script; tipos mínimos para el mapa
interface GoogleMap {
  fitBounds: (b: unknown, padding?: number) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMarker {
  setMap: (m: GoogleMap | null) => void;
}

interface GoogleLatLngBounds {
  extend: (p: { lat: number; lng: number }) => void;
}

declare const google: {
  maps: {
    Map: new (el: HTMLElement, o: object) => GoogleMap;
    Marker: new (o: object) => GoogleMarker;
    LatLngBounds: new () => GoogleLatLngBounds;
  };
};

interface TechnicianLocation {
  technicianId: string;
  technicianName: string;
  technicianEmail: string;
  projectId: string;
  projectName: string;
  location: {
    lat: number;
    lng: number;
    timestamp: string;
    activityType: string | null;
  } | null;
  status: string;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MAP_CALLBACK = "initRelectrikMap";

export default function LiveMapPage() {
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLocations() {
    try {
      const res = await fetch("/api/technicians/live-locations");
      if (!res.ok) {
        throw new Error("Failed to fetch locations");
      }
      const data = await res.json();
      setLocations(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  // Load Google Maps script once only (no dependency on locations)
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;

    if (typeof google !== "undefined" && google.maps) {
      scriptLoadedRef.current = true;
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      scriptLoadedRef.current = true;
      return;
    }

    const w = window as Window & { [MAP_CALLBACK]?: () => void };
    w[MAP_CALLBACK] = () => {
      scriptLoadedRef.current = true;
      setMapLoadError(null);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=${MAP_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setMapLoadError("Could not load Google Maps. Check your API key and network.");
      w[MAP_CALLBACK] = undefined;
    };
    document.head.appendChild(script);

    return () => {
      w[MAP_CALLBACK] = undefined;
    };
  }, [GOOGLE_MAPS_KEY]);

  // Mount map once; on location updates only refresh markers (no re-create = no flicker)
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current || mapLoadError) return;

    const withLocations = locations.filter((loc): loc is TechnicianLocation & { location: NonNullable<TechnicianLocation["location"]> } => Boolean(loc.location));

    function updateMarkersOnly(map: GoogleMap) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      withLocations.forEach((loc) => {
        const pos = loc.location;
        const marker = new google.maps.Marker({
          position: { lat: pos.lat, lng: pos.lng },
          map,
          title: loc.technicianName,
        });
        markersRef.current.push(marker);
      });
      if (withLocations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        withLocations.forEach((l) => bounds.extend({ lat: l.location.lat, lng: l.location.lng }));
        map.fitBounds(bounds, 40);
        if (withLocations.length === 1) {
          map.setZoom(14);
        }
      }
    }

    function initOrUpdateMap() {
      if (!mapRef.current || typeof google === "undefined" || !google.maps) return;
      try {
        const map = mapInstanceRef.current;
        if (map) {
          // Map already exists: only update markers (no re-render of map = no flicker)
          updateMarkersOnly(map);
          return;
        }
        // First run: create map once
        const defaultCenter = withLocations[0]?.location ?? { lat: 19.4326, lng: -99.1332 };
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
          zoom: withLocations.length === 1 ? 14 : 10,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        mapInstanceRef.current = newMap;
        updateMarkersOnly(newMap);
        setMapLoadError(null);
      } catch (e) {
        setMapLoadError(
          e instanceof Error ? e.message : "Google Maps error. Verify API key and enable Maps JavaScript API."
        );
      }
    }

    function cleanupMap() {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
      }
    }

    if (typeof google !== "undefined" && google.maps) {
      initOrUpdateMap();
      return cleanupMap;
    }

    const checkInterval = setInterval(() => {
      if (typeof google !== "undefined" && google.maps) {
        clearInterval(checkInterval);
        initOrUpdateMap();
      }
    }, 100);
    return () => {
      clearInterval(checkInterval);
      cleanupMap();
    };
  }, [GOOGLE_MAPS_KEY, locations, mapLoadError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  const hasGoogleMap = Boolean(GOOGLE_MAPS_KEY);
  const withLocations = locations.filter((loc) => loc.location);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Live Map — Technicians</h1>
        <p className="text-slate-400">
          Real-time location of technicians with an active session (Punch In).
          {!hasGoogleMap && (
            <> Add <code className="text-slate-500 bg-slate-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code className="text-slate-500 bg-slate-800 px-1 rounded">.env</code> to show the map with Google Maps.</>
          )}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {mapLoadError && hasGoogleMap && (
        <div className="bg-amber-900/50 border border-amber-700 rounded-lg p-4 text-amber-200">
          <p className="font-medium mb-2">Mapa no cargó correctamente</p>
          <p className="text-sm mb-2">{mapLoadError}</p>
          <p className="text-xs text-amber-300/80">
            Verifica en Google Cloud Console: API key válida, Maps JavaScript API habilitada, facturación activa
            y que el dominio ({typeof window !== "undefined" ? window.location.origin : ""}) esté permitido.
          </p>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-6">
        <div className="h-[400px] sm:h-[500px] md:h-[600px] bg-slate-900 rounded-lg relative overflow-hidden">
          {/* Map container: always empty so Google Maps owns it; no React children = no removeChild conflict on unmount */}
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          {!hasGoogleMap && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500">
                <div className="text-4xl mb-4">🗺️</div>
                <p className="text-lg mb-2">Map</p>
                <p className="text-sm">
                  {withLocations.length === 0
                    ? "No technicians with active session"
                    : `${withLocations.length} active technician${withLocations.length > 1 ? "s" : ""}`}
                </p>
                <p className="text-xs mt-4 text-slate-600">
                  Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env (Maps JavaScript API in Google Cloud).
                </p>
              </div>
            </div>
          )}
          {hasGoogleMap && withLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-500">No technicians with location at this time</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Active Technicians</h2>
        {locations.length === 0 ? (
          <p className="text-slate-400">No active technicians at this time</p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.technicianId}
                className="border border-slate-700 rounded-lg p-4 bg-slate-900/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-white font-medium">{loc.technicianName}</h3>
                    <p className="text-sm text-slate-400">{loc.technicianEmail}</p>
                    {loc.location && (
                      <p className="text-xs text-slate-500 mt-1">
                        Project: {loc.projectName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          loc.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-sm text-slate-300">{loc.status}</span>
                    </div>
                    {loc.location && (
                      <div className="text-xs text-slate-500">
                        <div>Lat: {loc.location.lat.toFixed(6)}</div>
                        <div>Lng: {loc.location.lng.toFixed(6)}</div>
                        <div className="mt-1">
                          {new Date(loc.location.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
