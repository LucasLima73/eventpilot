import { ensureComposeFileExists, runDockerCompose } from "../docker-runner.js";

export async function up(): Promise<void> {
  ensureComposeFileExists();
  await runDockerCompose(["up", "-d"]);
}
