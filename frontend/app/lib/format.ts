// Pure presentation helpers — unit-tested (no React/Clerk imports so they're
// trivially testable in node).

export function formatRate(monthly: number | null | undefined): string {
  if (monthly == null) return "—";
  return `$${monthly.toLocaleString()}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
