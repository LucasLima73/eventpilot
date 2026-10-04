import type { LiveEvent } from "../hooks/useLiveEvents.js";

function truncate(value: string | null, max = 80): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function LiveEvents({ events, connected }: { events: LiveEvent[]; connected: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Live events
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${
            connected ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
          />
          {connected ? "connected" : "disconnected"}
        </span>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-slate-400">
          Waiting for events — publish something on a tracked topic to see it here.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {events.map((event, index) => (
          <li
            key={`${event.timestamp}-${index}`}
            className="rounded border border-slate-100 bg-slate-50 p-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-800">{event.topic}</span>
              <span className="text-slate-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-1 text-slate-600">{truncate(event.value)}</div>
            {event.correlationId && (
              <div className="mt-1 text-slate-400">correlation: {event.correlationId}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
