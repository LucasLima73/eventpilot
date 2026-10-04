import { ensureComposeFileExists, runDockerCompose } from "../docker-runner.js";

export async function down(): Promise<void> {
  ensureComposeFileExists();
  await runDockerCompose(["down"]);
}
