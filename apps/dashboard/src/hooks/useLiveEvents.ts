import { useEffect, useState } from "react";

export interface LiveEvent {
  topic: string;
  key: string | null;
  value: string | null;
  correlationId: string | null;
  causationId: string | null;
  timestamp: string;
}

export function useLiveEvents(limit = 50): { events: LiveEvent[]; connected: boolean } {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${proto}://${window.location.host}/ws/events`);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (message) => {
      const event = JSON.parse(message.data as string) as LiveEvent;
      setEvents((prev) => [event, ...prev].slice(0, limit));
    };

    return () => socket.close();
  }, [limit]);

  return { events, connected };
}
