function decodeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCount(value: string) {
  return Number.parseInt(value.replaceAll(",", ""), 10);
}

function requiredMatch(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match?.[1]) {
    throw new Error(`NJDG page did not contain ${label}.`);
  }
  return parseCount(match[1]);
}

function captureTimestamp(text: string) {
  const matches = [
    ...text.matchAll(/\b(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\b/g),
  ];
  const match = matches.at(-1);
  if (!match) {
    return new Date().toISOString();
  }

  const [, day, month, year, hour, minute, second] = match;
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 5,
    Number(minute) - 30,
    Number(second),
  );
  return new Date(utcMillis).toISOString();
}

function coramTotal(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escaped}\\s+[\\d,]+\\s*\\([\\d,]+\\)\\s+[\\d,]+\\s*\\([\\d,]+\\)\\s+[\\d,]+\\s*\\(([\\d,]+)\\)`,
    "i",
  );
  const match = text.match(pattern);
  return match?.[1] ? parseCount(match[1]) : null;
}

export function parseNjdgSnapshotHtml(
  html: string,
  sourceUrl = "https://scdg.sci.gov.in/scnjdg/?p=home",
) {
  const text = decodeHtml(html);
  const civilPending = requiredMatch(
    text,
    /Pending Civil Cases\s+([\d,]+)/i,
    "pending civil cases",
  );
  const criminalPending = requiredMatch(
    text,
    /Pending Criminal Cases\s+([\d,]+)/i,
    "pending criminal cases",
  );
  const totalPending = requiredMatch(
    text,
    /Total Pending Cases\s+([\d,]+)/i,
    "total pending cases",
  );
  const institutedThisMonth = requiredMatch(
    text,
    /Instituted in last month civil cases\s+[\d,]+[\s\S]*?criminal cases\s+[\d,]+[\s\S]*?total cases\s+([\d,]+)/i,
    "cases instituted in the last month",
  );
  const disposedThisMonth = requiredMatch(
    text,
    /Disposal in last month civil cases\s+[\d,]+[\s\S]*?criminal cases\s+[\d,]+[\s\S]*?total cases\s+([\d,]+)/i,
    "cases disposed in the last month",
  );
  const oldCasesDisposedThisMonth = requiredMatch(
    text,
    /Cases Disposed In Last Month\s*\(more than 10 years old\)\s+[\d,]+\s+[\d,]+\s+([\d,]+)/i,
    "cases over ten years old disposed in the last month",
  );

  const coramPending = [
    "3 Judges",
    "5 Judges",
    "7 Judges",
    "9 Judges",
    "11 Judges",
    "More than 11 Judges",
  ].flatMap((benchSize) => {
    const pending = coramTotal(text, benchSize);
    return pending === null ? [] : [{ benchSize, pending }];
  });

  if (coramPending.length < 4) {
    throw new Error("NJDG page did not contain the expected coram-wise table.");
  }
  if (civilPending + criminalPending !== totalPending) {
    throw new Error(
      `NJDG civil and criminal totals (${civilPending + criminalPending}) do not equal total pendency (${totalPending}).`,
    );
  }

  const capturedAt = captureTimestamp(text);
  return {
    sourceName: "National Judicial Data Grid - Supreme Court of India dashboard",
    sourceUrl,
    capturedAt,
    reportingPeriod: `As displayed by NJDG Supreme Court dashboard at ${capturedAt}`,
    totalPending,
    civilPending,
    criminalPending,
    institutedThisMonth,
    disposedThisMonth,
    oldCasesDisposedThisMonth,
    coramPending,
    confidence: "high" as const,
    notes: [
      "Captured from the official NJDG Supreme Court of India At a Glance page.",
      "Civil/criminal pendency and monthly institution/disposal figures are copied from the dashboard totals.",
      "Coram-wise figures use the dashboard totals shown in brackets, which include main and connected matters.",
      "This is a timestamped public dashboard snapshot, not an official API or a historical time series supplied by NJDG.",
    ],
  };
}
