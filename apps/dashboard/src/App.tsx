import { useEffect, useState } from "react";

import { fetchConfig, fetchTopics, type EventPilotConfig, type TopicInfo } from "./api.js";
import { EventGraph } from "./components/EventGraph.js";
import { LiveEvents } from "./components/LiveEvents.js";
import { TopicsTable } from "./components/TopicsTable.js";
import { useLiveEvents } from "./hooks/useLiveEvents.js";

export function App() {
  const [config, setConfig] = useState<EventPilotConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicInfo[] | null>(null);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const { events, connected } = useLiveEvents();

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch((err) => setConfigError((err as Error).message));
  }, []);

  useEffect(() => {
    const load = () => {
      fetchTopics()
        .then(setTopics)
        .catch((err) => setTopicsError((err as Error).message));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          EventPilot {config ? `— ${config.project.name}` : ""}
        </h1>
        {config && (
          <p className="text-sm text-slate-500">
            broker: {config.broker.type} ({config.broker.version}) · {config.services.length}{" "}
            service(s)
          </p>
        )}
        {configError && <p className="text-sm text-red-600">{configError}</p>}
      </header>

      {config && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventGraph config={config} />
          </div>
          <div className="flex flex-col gap-4">
            <TopicsTable topics={topics} error={topicsError} />
            <LiveEvents events={events} connected={connected} />
          </div>
        </div>
      )}
    </div>
  );
}
