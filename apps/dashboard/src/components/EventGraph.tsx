import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";

import type { EventPilotConfig } from "../api.js";
import type { LiveEvent } from "../hooks/useLiveEvents.js";

const HIGHLIGHT_MS = 1200;
const HIGHLIGHT_NODE_STYLE = { boxShadow: "0 0 0 2px #f59e0b" };
const HIGHLIGHT_EDGE_STYLE = { stroke: "#f59e0b", strokeWidth: 2 };

function buildGraph(config: EventPilotConfig): { nodes: Node[]; edges: Edge[] } {
  const topicNames = new Set<string>();
  for (const service of config.services) {
    for (const topic of [...service.produces, ...service.consumes]) topicNames.add(topic);
  }
  const topics = [...topicNames];

  const nodes: Node[] = [
    ...config.services.map((service, i) => ({
      id: `producer:${service.name}`,
      position: { x: 0, y: i * 90 },
      data: { label: service.name },
      type: "input",
      style: { background: "#eef2ff", border: "1px solid #818cf8" },
    })),
    ...topics.map((topic, i) => ({
      id: `topic:${topic}`,
      position: { x: 320, y: i * 70 },
      data: { label: topic },
      style: { background: "#f0fdf4", border: "1px solid #4ade80", fontFamily: "monospace" },
    })),
    ...config.services.map((service, i) => ({
      id: `consumer:${service.name}`,
      position: { x: 640, y: i * 90 },
      data: { label: service.name },
      type: "output",
      style: { background: "#eef2ff", border: "1px solid #818cf8" },
    })),
  ];

  const edges: Edge[] = [];
  for (const service of config.services) {
    for (const topic of service.produces) {
      edges.push({
        id: `produce:${service.name}:${topic}`,
        source: `producer:${service.name}`,
        target: `topic:${topic}`,
      });
    }
    for (const topic of service.consumes) {
      edges.push({
        id: `consume:${topic}:${service.name}`,
        source: `topic:${topic}`,
        target: `consumer:${service.name}`,
      });
    }
  }

  return { nodes, edges };
}

/** Which node/edge ids should flash for this event. Falls back to "every edge touching the
 * topic" when there's no service attribution (e.g. a broker-tail event). */
function activeIdsForEvent(event: LiveEvent, edges: Edge[]): string[] {
  const topicId = `topic:${event.topic}`;

  if (event.direction === "produce" && event.service) {
    return [topicId, `produce:${event.service}:${event.topic}`];
  }
  if (event.direction === "consume" && event.service) {
    return [topicId, `consume:${event.topic}:${event.service}`];
  }

  const touchingEdges = edges
    .filter((edge) => edge.source === topicId || edge.target === topicId)
    .map((edge) => edge.id);
  return [topicId, ...touchingEdges];
}

export function EventGraph({
  config,
  events,
}: {
  config: EventPilotConfig;
  events: LiveEvent[];
}) {
  const { nodes, edges } = useMemo(() => buildGraph(config), [config]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const latest = events[0];
    if (!latest) return;

    const ids = activeIdsForEvent(latest, edges);
    setActiveIds((prev) => new Set([...prev, ...ids]));

    // Intentionally no cleanup: each event's highlight must expire on its own timer
    // regardless of whether another event arrives before it does. Clearing this on every
    // re-render would cancel the removal for everything but the last event in a fast burst
    // (e.g. the initial history replay), leaving stale highlights stuck on permanently.
    setTimeout(() => {
      setActiveIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, HIGHLIGHT_MS);
  }, [events, edges]);

  const styledNodes = nodes.map((node) =>
    activeIds.has(node.id)
      ? { ...node, style: { ...node.style, ...HIGHLIGHT_NODE_STYLE } }
      : node,
  );
  const styledEdges = edges.map((edge) =>
    activeIds.has(edge.id) ? { ...edge, animated: true, style: HIGHLIGHT_EDGE_STYLE } : edge,
  );

  return (
    <div className="h-96 rounded-lg border border-slate-200 bg-white shadow-sm">
      <ReactFlow nodes={styledNodes} edges={styledEdges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
