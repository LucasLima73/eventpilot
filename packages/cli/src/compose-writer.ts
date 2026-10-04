import type { ComposeFragment } from "@eventpilot/plugin-api";
import { stringify } from "yaml";

export function mergeFragments(...fragments: ComposeFragment[]): ComposeFragment {
  return fragments.reduce<ComposeFragment>(
    (merged, fragment) => ({
      services: { ...merged.services, ...fragment.services },
      volumes: { ...merged.volumes, ...fragment.volumes },
    }),
    { services: {}, volumes: {} },
  );
}

export function renderCompose(fragment: ComposeFragment): string {
  const doc = {
    services: fragment.services,
    ...(fragment.volumes && Object.keys(fragment.volumes).length > 0
      ? { volumes: fragment.volumes }
      : {}),
  };
  return stringify(doc);
}
