import { loadConfig } from "@pilotevent/core";

import { resolveBroker } from "../brokers.js";

export async function metrics(topic: string): Promise<void> {
  const config = await loadConfig("eventpilot.yaml");
  const broker = resolveBroker(config.broker.type);

  console.log(`Measuring ${topic} (samples throughput over ~1s)...`);
  const result = await broker.getMetrics(topic);

  console.log(`  throughput:    ${result.throughputPerSec.toFixed(2)} msg/s`);
  console.log(`  consumer lag:  ${result.consumerLag}`);
  console.log(`  dlq messages:  ${result.dlqCount}`);
  console.log(
    `  error count:   ${result.errorCount} (not tracked yet — needs the SDK's error reporting)`,
  );
}
