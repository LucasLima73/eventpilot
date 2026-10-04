import type { ComposeFragment } from "@eventpilot/plugin-api";
import { stringify } from "yaml";

export function renderCompose(fragment: ComposeFragment): string {
  const doc = {
    services: fragment.services,
    ...(fragment.volumes ? { volumes: fragment.volumes } : {}),
  };
  return stringify(doc);
}
