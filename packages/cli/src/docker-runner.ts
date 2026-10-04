import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

export function ensureComposeFileExists(): void {
  if (!existsSync("docker-compose.yml")) {
    throw new Error("docker-compose.yml not found. Run `eventpilot init` first.");
  }
}

export function runDockerCompose(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["compose", "-f", "docker-compose.yml", ...args], {
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker compose ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
