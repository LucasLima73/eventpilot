import { loadConfig } from "@eventpilot/core";

export async function validate(): Promise<void> {
  try {
    const config = await loadConfig("eventpilot.yaml");
    console.log(
      `✔ eventpilot.yaml is valid — ${config.services.length} service(s), ${config.topics.length} topic(s).`,
    );
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}
