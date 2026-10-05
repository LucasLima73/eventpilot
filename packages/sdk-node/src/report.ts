export interface TraceEvent {
  service: string;
  direction: "produce" | "consume";
  topic: string;
  correlationId: string | null;
  causationId: string | null;
  timestamp: string;
}

/**
 * Telemetry must never break the caller's actual produce/consume flow, so failures
 * (control plane unreachable, down, etc.) are swallowed rather than thrown.
 */
export async function reportTrace(controlPlaneUrl: string, event: TraceEvent): Promise<void> {
  try {
    await fetch(`${controlPlaneUrl}/api/traces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // control plane unreachable or down — not the caller's problem.
  }
}
