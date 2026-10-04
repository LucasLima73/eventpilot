export async function dashboard(): Promise<void> {
  console.log(
    [
      "The dashboard and control plane exist (apps/dashboard, apps/control-plane-api) but",
      "aren't wired into this CLI command yet — that packaging step is still open.",
      "",
      "For now, from the eventpilot monorepo:",
      "  pnpm --filter @eventpilot/dashboard build",
      "  node apps/control-plane-api/dist/bin.js --project <path-to-your-project> --port 4000",
      "Then open http://localhost:4000",
      "",
      "(Your project's eventpilot.yaml and broker from `eventpilot up` must already exist.)",
    ].join("\n"),
  );
}
