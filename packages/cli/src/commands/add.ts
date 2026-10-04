export async function add(feature: string): Promise<void> {
  console.error(
    `\`eventpilot add ${feature}\` isn't implemented yet. Feature modules (dlq, outbox, ` +
      "metrics, replay) are planned for Phase 2 of the roadmap. See CLAUDE.md, section 10.",
  );
  process.exitCode = 1;
}
