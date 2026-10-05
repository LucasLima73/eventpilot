import { useEffect, useState } from "react";

import { fetchMetrics, fetchReplay, type ReplayedEvent, type TopicMetrics } from "../api.js";

function truncate(value: string, max = 100): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function TopicInspector({ topicNames }: { topicNames: string[] }) {
  const [selected, setSelected] = useState(topicNames[0] ?? "");
  const [metrics, setMetrics] = useState<TopicMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [replayed, setReplayed] = useState<ReplayedEvent[] | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setMetrics(null);
    setMetricsError(null);
    setReplayed(null);

    const load = () => {
      fetchMetrics(selected)
        .then(setMetrics)
        .catch((err) => setMetricsError((err as Error).message));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  async function handleReplay() {
    setReplaying(true);
    setReplayError(null);
    try {
      setReplayed(await fetchReplay(selected, { limit: 20 }));
    } catch (err) {
      setReplayError((err as Error).message);
    } finally {
      setReplaying(false);
    }
  }

  if (topicNames.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Topic inspector
        </h2>
        <select
          className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {topicNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {metricsError && <p className="text-sm text-red-600">{metricsError}</p>}
      {!metricsError && !metrics && <p className="text-sm text-slate-400">Measuring…</p>}
      {metrics && (
        <dl className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">throughput</dt>
            <dd className="font-mono text-slate-800">{metrics.throughputPerSec.toFixed(2)}/s</dd>
          </div>
          <div>
            <dt className="text-slate-400">consumer lag</dt>
            <dd className="font-mono text-slate-800">{metrics.consumerLag}</dd>
          </div>
          <div>
            <dt className="text-slate-400">dlq messages</dt>
            <dd className="font-mono text-slate-800">{metrics.dlqCount}</dd>
          </div>
          <div>
            <dt className="text-slate-400">errors</dt>
            <dd className="font-mono text-slate-800">{metrics.errorCount}</dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        onClick={handleReplay}
        disabled={replaying}
        className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {replaying ? "Replaying…" : "Replay last 20 events"}
      </button>

      {replayError && <p className="mt-2 text-sm text-red-600">{replayError}</p>}
      {replayed && (
        <ul className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
          {replayed.length === 0 && (
            <li className="text-sm text-slate-400">No events on this topic yet.</li>
          )}
          {replayed.map((event, i) => (
            <li
              key={i}
              className="rounded border border-slate-100 bg-slate-50 p-1.5 text-xs text-slate-600"
            >
              {event.key && <span className="font-mono text-slate-800">{event.key}: </span>}
              {truncate(event.value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
