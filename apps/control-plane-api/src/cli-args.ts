export interface ControlPlaneArgs {
  projectDir: string;
  port: number;
  brokers: string[];
}

export function parseArgs(argv: string[]): ControlPlaneArgs {
  const args: ControlPlaneArgs = {
    projectDir: process.cwd(),
    port: Number(process.env.PORT ?? 4000),
    brokers: (process.env.EVENTPILOT_BROKERS ?? "localhost:9092").split(","),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project") args.projectDir = argv[++i];
    else if (arg === "--port") args.port = Number(argv[++i]);
    else if (arg === "--brokers") args.brokers = argv[++i].split(",");
  }

  return args;
}
