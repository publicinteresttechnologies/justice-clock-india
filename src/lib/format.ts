export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Missing from current source";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(1)}%`;
}

export function formatYears(value: number | null) {
  if (value === null) {
    return "Not available";
  }

  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} years`;
}

export function sortedEntries(record: Record<string, number>) {
  return Object.entries(record).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
