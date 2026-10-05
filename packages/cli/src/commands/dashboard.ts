import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

export interface DashboardOptions {
  port?: string;
}

export async function dashboard(options: DashboardOptions): Promise<void> {
  const port = options.port ?? "4000";

  const require = createRequire(import.meta.url);
  let binPath: string;
  try {
    const pkgJsonPath = require.resolve("@pilotevent/control-plane-api/package.json");
    binPath = path.join(path.dirname(pkgJsonPath), "dist", "bin.js");
  } catch {
    console.error(
      "Could not find @pilotevent/control-plane-api — reinstall eventpilot (npm install -g eventpilot) and try again.",
    );
    process.exitCode = 1;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [binPath, "--project", process.cwd(), "--port", port], {
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`dashboard exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
