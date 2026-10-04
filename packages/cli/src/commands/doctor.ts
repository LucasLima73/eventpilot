import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

function checkNode(): CheckResult {
  const major = Number(process.version.slice(1).split(".")[0]);
  return { label: "Node.js >= 20", ok: major >= 20, detail: process.version };
}

async function checkDocker(): Promise<CheckResult> {
  try {
    const { stdout } = await execFileAsync("docker", ["-v"]);
    return { label: "Docker installed", ok: true, detail: stdout.trim() };
  } catch {
    return {
      label: "Docker installed",
      ok: false,
      detail: "not found — install it: https://docs.docker.com/get-docker/",
    };
  }
}

async function checkDockerDaemon(): Promise<CheckResult> {
  try {
    await execFileAsync("docker", ["info"]);
    return { label: "Docker daemon running", ok: true, detail: "reachable" };
  } catch {
    return {
      label: "Docker daemon running",
      ok: false,
      detail: "not reachable — start Docker and try again",
    };
  }
}

export async function doctor(): Promise<void> {
  const checks = [checkNode(), await checkDocker(), await checkDockerDaemon()];

  for (const check of checks) {
    console.log(`${check.ok ? "✔" : "✘"} ${check.label} — ${check.detail}`);
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  }
}
