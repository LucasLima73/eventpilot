import { loadConfig } from "@pilotevent/core";

import { validateContracts } from "../validate-contracts.js";

export async function validate(): Promise<void> {
  let config;
  try {
    config = await loadConfig("eventpilot.yaml");
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
    return;
  }

  console.log(
    `✔ eventpilot.yaml is valid — ${config.services.length} service(s), ${config.topics.length} topic(s).`,
  );

  const withContracts = config.topics.filter((t) => t.schema);
  if (withContracts.length === 0) {
    console.log(
      `· no topic declares a \`schema\` — nothing to validate against ${config.contracts.format}. ` +
        "Add `schema: ./contracts/<file>` to a topic to check it.",
    );
    return;
  }

  const results = await validateContracts(config);
  for (const result of results) {
    if (result.ok) {
      console.log(`✔ ${result.topic} — ${result.contractPath}`);
    } else {
      console.log(`✘ ${result.topic} — ${result.contractPath}`);
      for (const error of result.errors) console.log(`    ${error}`);
    }
  }

  if (results.some((r) => !r.ok)) {
    process.exitCode = 1;
  }
}
