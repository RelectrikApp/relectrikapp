"use client";

import { useState, useEffect, useRef } from "react";

// Google Maps se carga por script; tipos mínimos para el mapa
declare const google: {
  maps: {
    Map: new (el: HTMLElement, o: object) => { fitBounds: (b: unknown) => void };
    Marker: new (o: object) => { setMap: (m: unknown) => void };
    LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
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

export default function LiveMapPage() {
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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

  // Google Maps: un solo mapa con todos los técnicos visibles
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

    const withLocations = locations.filter((loc) => loc.location);

    function initMap() {
      if (!mapRef.current || typeof google === "undefined") return;
      // Centro por defecto (se ajusta con fitBounds si hay puntos)
      const defaultCenter = withLocations[0]?.location ?? { lat: 19.4326, lng: -99.1332 };
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
        zoom: withLocations.length === 1 ? 14 : 10,
        mapTypeControl: true,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      withLocations.forEach((loc) => {
        const pos = loc.location!;
        const marker = new google.maps.Marker({
          position: { lat: pos.lat, lng: pos.lng },
          map,
          title: loc.technicianName,
        });
        markersRef.current.push(marker);
      });
      // Todos los técnicos en el mismo mapa: fitBounds con padding
      if (withLocations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        withLocations.forEach((l) => bounds.extend({ lat: l.location!.lat, lng: l.location!.lng }));
        map.fitBounds(bounds, 40);
        if (withLocations.length === 1) {
          map.setZoom(14);
        }
      }
    }

    if (typeof google !== "undefined" && google.maps) {
      initMap();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initRelectrikMap`;
    script.async = true;
    (window as Window & { initRelectrikMap?: () => void }).initRelectrikMap = initMap;
    document.head.appendChild(script);
    return () => {
      (window as Window & { initRelectrikMap?: () => void }).initRelectrikMap = undefined;
    };
  }, [GOOGLE_MAPS_KEY, locations]);

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
        <h1 className="text-2xl font-bold text-white mb-2">Live Map — Technicians</h1>
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

      <div className="bg-slate-800 rounded-lg p-6">
        <div className="h-[600px] bg-slate-900 rounded-lg relative overflow-hidden" ref={mapRef}>
          {!hasGoogleMap && (
            <div className="absolute inset-0 flex items-center justify-center">
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
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-500">No technicians with location at this time</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Active Technicians</h2>
        {locations.length === 0 ? (
          <p className="text-slate-400">No active technicians at this time</p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.technicianId}
                className="border border-slate-700 rounded-lg p-4 bg-slate-900/50"
              >
                <div className="flex items-center justify-between">
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
