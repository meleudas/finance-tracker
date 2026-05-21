const TTL_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function jwtTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
  if (!match) {
    throw new Error(`Invalid JWT TTL format: ${ttl}`);
  }

  const value = Number(match[1]);
  const unitRaw = match[2];
  if (!unitRaw) {
    throw new Error(`Invalid JWT TTL format: ${ttl}`);
  }
  const unit = unitRaw.toLowerCase();
  const multiplier = TTL_UNIT_MS[unit];

  if (!multiplier) {
    throw new Error(`Invalid JWT TTL unit: ${unit}`);
  }

  return value * multiplier;
}
