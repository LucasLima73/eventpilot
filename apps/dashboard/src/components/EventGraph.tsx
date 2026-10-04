import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { EventPilotConfig } from "../api.js";

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

export function EventGraph({ config }: { config: EventPilotConfig }) {
  const { nodes, edges } = buildGraph(config);

  return (
    <div className="h-96 rounded-lg border border-slate-200 bg-white shadow-sm">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
