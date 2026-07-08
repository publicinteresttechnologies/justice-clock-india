type ChartDatum = {
  label: string;
  value: number | null | undefined;
};

type SimpleBarChartProps = {
  data: ChartDatum[];
  valueLabel?: (value: number) => string;
};

export function SimpleBarChart({
  data,
  valueLabel = (value) => String(value),
}: SimpleBarChartProps) {
  const availableData = data.filter(
    (item): item is { label: string; value: number } =>
      typeof item.value === "number",
  );
  const maxValue = Math.max(...availableData.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const value = typeof item.value === "number" ? item.value : null;
        const width =
          value === null ? "0%" : `${Math.max((value / maxValue) * 100, 4)}%`;

        return (
          <div className="space-y-1" key={item.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-950">
                {value === null ? "Missing from current source" : valueLabel(value)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-700"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
