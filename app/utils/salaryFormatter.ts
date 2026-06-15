/**
 * Format a salary value (in lakhs) into a display string.
 * e.g. 12 → "₹12L", 0.5 → "₹50K", 50 → "₹50L+"
 */
export function formatSalary(value: number, isMax?: boolean): string {
  if (value === 0) return '₹0';
  if (value < 1) return `₹${Math.round(value * 100)}K`;
  if (isMax && value >= 50) return '₹50L+';
  return `₹${value}L`;
}

export function formatSalaryRange(min: number, max: number): string {
  return `${formatSalary(min)} — ${formatSalary(max, true)} / yr`;
}
