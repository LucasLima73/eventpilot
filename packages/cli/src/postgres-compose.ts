import type { ComposeFragment } from "@pilotevent/plugin-api";

/** Postgres, used as the outbox store. Not broker-specific, so it isn't part of any BrokerAdapter. */
export function postgresCompose(): ComposeFragment {
  return {
    services: {
      postgres: {
        image: "postgres:16-alpine",
        container_name: "eventpilot-postgres",
        environment: {
          POSTGRES_USER: "eventpilot",
          POSTGRES_PASSWORD: "eventpilot",
          POSTGRES_DB: "eventpilot",
        },
        ports: ["5432:5432"],
        volumes: ["eventpilot-postgres-data:/var/lib/postgresql/data"],
      },
    },
    volumes: {
      "eventpilot-postgres-data": {},
    },
  };
}

export const OUTBOX_CONNECTION_STRING =
  "postgres://eventpilot:eventpilot@localhost:5432/eventpilot";
