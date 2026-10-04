const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Converts a "7d" / "24h" / "30m" / "45s" style duration into milliseconds. */
export function retentionToMs(retention: string): number {
  const match = /^(\d+)([smhd])$/.exec(retention);
  if (!match) {
    throw new Error(`Invalid retention "${retention}", expected e.g. "7d", "24h", "30m", "45s".`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}
