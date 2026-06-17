type AdFormat = "banner" | "rectangle" | "multiplex" | "in-feed";

type AdSlotProps = {
  slotName: string;
  className?: string;
  format?: AdFormat;
};

function envSlotKey(slotName: string) {
  return `NEXT_PUBLIC_ADSENSE_SLOT_${slotName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

export function AdSlot({ slotName, className = "", format = "banner" }: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env[envSlotKey(slotName)];

  if (!client || !slot) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`rounded-2xl border border-dashed border-slate-200 bg-white/70 p-3 text-center ${className}`}
      data-ad-slot-name={slotName}
      data-ad-format-name={format}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        Advertisement
      </p>

      <ins
        className="adsbygoogle block min-h-24 w-full"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format === "multiplex" ? "autorelaxed" : "auto"}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
