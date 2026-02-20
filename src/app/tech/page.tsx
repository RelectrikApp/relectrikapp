"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TechSignOut } from "./TechSignOut";

const LOCATION_ASKED_KEY = "relectrik_location_asked";

interface WorkSession {
  id: string;
  startTime: string;
  isActive: boolean;
  project?: {
    id: string;
    clientName: string;
    address: string;
  };
}

interface Project {
  id: string;
  clientName: string;
  address: string;
  description: string | null;
  status: string;
}

export default function TechHomePage() {
  const router = useRouter();
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [locationMessageDismissed, setLocationMessageDismissed] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Fetch current work session and assigned projects
  useEffect(() => {
    fetchData();
    // Poll for work session updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [sessionRes, projectsRes] = await Promise.all([
        fetch("/api/work-sessions/current"),
        fetch("/api/projects/assigned"),
      ]);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setWorkSession(sessionData.isActive ? sessionData.session : null);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePunchIn() {
    setPunchLoading(true);
    setError("");
    try {
      // Get first assigned project if available
      const projectId = projects.length > 0 ? projects[0].id : null;

      const res = await fetch("/api/work-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || `Failed to punch in (${res.status})`;
        console.error("Punch in error:", errorMsg, data);
        throw new Error(errorMsg);
      }

      const session = await res.json();
      setWorkSession(session);
      startLocationTracking(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to punch in");
    } finally {
      setPunchLoading(false);
    }
  }

  async function handlePunchOut() {
    if (!workSession) return;

    setPunchLoading(true);
    setError("");
    try {
      const res = await fetch("/api/work-sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: workSession.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to punch out");
      }

      setWorkSession(null);
      stopLocationTracking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to punch out");
    } finally {
      setPunchLoading(false);
    }
  }

  async function handleStatusUpdate(projectId: string, status: string) {
    setStatusLoading(projectId);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Refresh projects
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusLoading(null);
    }
  }

  // GPS: se pide una sola vez; seguimiento continuo con watchPosition (siempre activo mientras la app está abierta)
  function startLocationTracking(sessionId: string) {
    if (!navigator.geolocation) {
      setError("This browser does not support location. Use a device with GPS.");
      return;
    }
    // Marcar que ya pedimos ubicación (solo se muestra el diálogo del navegador una vez)
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(LOCATION_ASKED_KEY, "1");
    }

    const sendPosition = (position: GeolocationPosition) => {
      fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          activityType: "AT_JOB_SITE",
        }),
      }).catch((err) => console.error("Error updating location:", err));
    };

    // watchPosition = seguimiento continuo (siempre activo); el navegador pide permiso una vez
    const id = navigator.geolocation.watchPosition(
      (position) => sendPosition(position),
      (err) => {
        console.error("Geolocation error:", err);
        if (err.code === 1 && !sessionStorage.getItem(LOCATION_ASKED_KEY + "_denied")) {
          sessionStorage.setItem(LOCATION_ASKED_KEY + "_denied", "1");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    watchIdRef.current = id;
  }

  function stopLocationTracking() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopLocationTracking();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f172a] p-4 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-4">
      <header className="flex items-center justify-between max-w-4xl mx-auto mb-8">
        <h1 className="text-xl font-bold text-white">Relectrikapp — Technician</h1>
        <TechSignOut />
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Work Session Controls */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Work Session</h3>
          <div className="flex gap-4">
            <button
              onClick={handlePunchIn}
              disabled={punchLoading || workSession !== null}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {punchLoading ? "Processing..." : "Punch In"}
            </button>
            <button
              onClick={handlePunchOut}
              disabled={punchLoading || workSession === null}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {punchLoading ? "Processing..." : "Punch Out"}
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Status:{" "}
            <span className={workSession ? "text-green-400" : "text-yellow-400"}>
              {workSession ? "Active" : "Not Active"}
            </span>
            {workSession && (
              <span className="ml-4">
                Started: {new Date(workSession.startTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          {workSession?.project && (
            <div className="mt-2 text-sm text-slate-300">
              Project: {workSession.project.clientName} - {workSession.project.address}
            </div>
          )}
        </div>

        {/* GPS Tracking - asked once; must stay on during shift */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Location (GPS)</h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                workSession ? "bg-green-500 animate-pulse" : "bg-gray-500"
              }`}
            ></div>
            <span className="text-slate-300">
              GPS {workSession ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {workSession
              ? "Location is sent in real time while your session is active."
              : "When you Punch In, location access will be requested once."}
          </p>
          {!locationMessageDismissed && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(LOCATION_ASKED_KEY) && (
            <div className="mt-4 p-4 bg-amber-900/30 border border-amber-700 rounded-lg">
              <p className="text-amber-200 text-sm">
                For real-time tracking, location must stay <strong>always on</strong> during your shift.
                When the browser asks, choose the most permissive option: <strong>&quot;Allow while visiting the site&quot;</strong>.
                If you lose connection, go offline, turn on airplane mode, or turn off your phone without Punching Out, your access will be blocked until 6:00 AM the next day.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLocationMessageDismissed(true);
                  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(LOCATION_ASKED_KEY, "1");
                }}
                className="mt-3 text-sm text-amber-300 hover:text-amber-100 underline"
              >
                Got it
              </button>
            </div>
          )}
        </div>

        {/* Assigned Projects */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Assigned Projects</h3>
          {projects.length === 0 ? (
            <div className="text-slate-400 text-sm">
              <p>No projects assigned</p>
              <p className="mt-2 text-xs">
                Projects will appear here when assigned by admin
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-slate-700 rounded-lg p-4 bg-slate-900/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-medium">{project.clientName}</h4>
                      <p className="text-sm text-slate-400">{project.address}</p>
                      {project.description && (
                        <p className="text-sm text-slate-500 mt-1">{project.description}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Update Status:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStatusUpdate(project.id, "IN_PROGRESS")}
                        disabled={statusLoading === project.id}
                        className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs disabled:opacity-50"
                      >
                        IN_PROGRESS
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(project.id, "COMPLETED")}
                        disabled={statusLoading === project.id}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50"
                      >
                        COMPLETED
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Material Logging */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Material Logging</h3>
          <div className="flex gap-4">
            <Link
              href="/tech/materials/purchase"
              className="px-6 py-3 bg-relectrik-orange text-black rounded-lg hover:opacity-90 font-medium"
            >
              Add Purchase
            </Link>
            <Link
              href="/tech/materials/usage"
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 font-medium"
            >
              Record Usage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
