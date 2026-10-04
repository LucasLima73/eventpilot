import type { BrokerConfig, ComposeFragment } from "@eventpilot/plugin-api";

const CONSOLE_VERSION = "v2.7.2";

/** Mirrors Redpanda's own single-node docker-compose quickstart. */
export function composeService(cfg: BrokerConfig): ComposeFragment {
  const tag = cfg.version && cfg.version !== "latest" ? cfg.version : "latest";

  return {
    services: {
      redpanda: {
        image: `docker.redpanda.com/redpandadata/redpanda:${tag}`,
        container_name: "eventpilot-redpanda",
        command: [
          "redpanda",
          "start",
          "--mode",
          "dev-container",
          "--kafka-addr",
          "PLAINTEXT://0.0.0.0:9092",
          "--advertise-kafka-addr",
          "PLAINTEXT://localhost:9092",
          "--pandaproxy-addr",
          "0.0.0.0:8082",
          "--advertise-pandaproxy-addr",
          "localhost:8082",
          "--schema-registry-addr",
          "0.0.0.0:8081",
        ],
        ports: ["9092:9092", "8081:8081", "8082:8082", "9644:9644"],
      },
      "redpanda-console": {
        image: `docker.redpanda.com/redpandadata/console:${CONSOLE_VERSION}`,
        container_name: "eventpilot-console",
        depends_on: ["redpanda"],
        ports: ["8080:8080"],
        environment: {
          KAFKA_BROKERS: "redpanda:9092",
        },
      },
    },
  };
}
