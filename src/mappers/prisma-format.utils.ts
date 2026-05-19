export function decimalToNumber(amount: unknown): number {
  if (typeof amount === "object" && amount !== null && "toNumber" in amount) {
    return (amount as { toNumber: () => number }).toNumber();
  }
  return Number(amount);
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}
