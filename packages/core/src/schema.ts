import { z } from "zod";

const identifier = z
  .string()
  .min(1, "cannot be empty")
  .regex(/^[a-z0-9][a-z0-9.-]*$/i, "use letters, numbers, '.' or '-' only");

const durationString = z
  .string()
  .regex(/^\d+[smhd]$/, "use a duration like '7d', '24h', '30m' or '45s'");

const serviceSchema = z.object({
  name: identifier,
  language: z.string().min(1, "cannot be empty"),
  produces: z.array(identifier).default([]),
  consumes: z.array(identifier).default([]),
});

const topicSchema = z.object({
  name: identifier,
  partitions: z.number().int().positive().default(1),
  retention: durationString.default("7d"),
  schema: z.string().optional(),
  dlq: z.boolean().default(false),
});

const dlqFeatureSchema = z.object({
  maxRetries: z.number().int().nonnegative().default(5),
  backoff: z.enum(["fixed", "exponential"]).default("exponential"),
});

const outboxFeatureSchema = z.object({
  enabled: z.boolean().default(true),
  store: z.string().min(1).default("postgres"),
});

const featuresSchema = z
  .object({
    dashboard: z.boolean().default(false),
    metrics: z.boolean().default(false),
    dlq: z.union([z.literal(false), dlqFeatureSchema]).optional(),
    outbox: z.union([z.literal(false), outboxFeatureSchema]).optional(),
    replay: z.boolean().default(false),
  })
  .default({});

export const eventPilotConfigSchema = z.object({
  version: z.literal(1),
  project: z.object({
    name: identifier,
  }),
  broker: z.object({
    type: z.string().min(1, "cannot be empty"),
    version: z.string().min(1, "cannot be empty"),
  }),
  contracts: z.object({
    format: z.enum(["asyncapi", "json-schema"]),
    path: z.string().min(1, "cannot be empty"),
  }),
  services: z.array(serviceSchema).min(1, "declare at least one service"),
  topics: z.array(topicSchema).default([]),
  features: featuresSchema,
});

export type EventPilotConfig = z.infer<typeof eventPilotConfigSchema>;
export type ServiceConfig = z.infer<typeof serviceSchema>;
export type TopicDefinition = z.infer<typeof topicSchema>;
