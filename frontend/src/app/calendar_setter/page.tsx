"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Calendar as CalendarIcon,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { CalendarEvent, CalendarEventCreateInput } from "@/lib/types";

export default function CalendarSetterPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("Virtual SecOps Room / Zoom");
  const [newEventType, setNewEventType] = useState("audit");

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.listEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartTime || !newEndTime) {
      setError("Title, Start Time, and End Time are required.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await api.createEvent({
        title: newTitle,
        description: newDescription || undefined,
        start_time: new Date(newStartTime).toISOString(),
        end_time: new Date(newEndTime).toISOString(),
        location: newLocation || undefined,
        event_type: newEventType,
      });

      // Reset
      setNewTitle("");
      setNewDescription("");
      setNewStartTime("");
      setNewEndTime("");
      setIsModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || "Failed to schedule event.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel and delete this scheduled event?")) return;

    try {
      await api.deleteEvent(id);
      fetchEvents();
    } catch (err: any) {
      alert("Failed to delete event: " + err.message);
    }
  };

  const getTagColor = (type?: string | null) => {
    switch (type) {
      case "audit":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "pentest":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "key-rotation":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Security Calendar & Audit Setter"
          subtitle="Timezone-aware scheduling for security reviews, key rotations, and compliance audits"
        />

        <main className="p-8 space-y-8 max-w-7xl">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                Operational Schedule
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage upcoming perimeter inspections and security compliance tasks
              </p>
            </div>

            <button
              onClick={() => {
                setError(null);
                // Pre-fill next hour default
                const now = new Date();
                now.setHours(now.getHours() + 1, 0, 0, 0);
                const later = new Date(now);
                later.setHours(later.getHours() + 1);
                setNewStartTime(now.toISOString().slice(0, 16));
                setNewEndTime(later.toISOString().slice(0, 16));
                setIsModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Event</span>
            </button>
          </div>

          {/* Events Grid / Timeline */}
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
              Loading security calendar...
            </div>
          ) : events.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No events scheduled</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Schedule a Quarterly Security Audit, Key Rotation, or Pentest review to stay compliant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur flex flex-col justify-between hover:border-slate-700 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getTagColor(
                          evt.event_type
                        )}`}
                      >
                        {evt.event_type || "general"}
                      </span>
                      <button
                        onClick={(e) => handleDeleteEvent(evt.id, e)}
                        title="Cancel event"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        {new Date(evt.start_time).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(evt.end_time).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {evt.location && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              Schedule Security Event
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Dates and timestamps are timezone-aware and synced with SecOps.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Quarterly Security Audit / Annual Pentest"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="audit">Security Audit</option>
                    <option value="pentest">Penetration Test</option>
                    <option value="key-rotation">Key Rotation</option>
                    <option value="compliance">Compliance Review</option>
                    <option value="incident">Incident Retrospective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Location / Room</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Check vault encryption keys, verify TLS certificates, review access logs..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {isCreating ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
