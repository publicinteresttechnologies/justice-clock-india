import Link from "next/link";

const items = [
  { href: "/", label: "Clock" },
  { href: "/case-types", label: "Case Types" },
  { href: "/judges", label: "Judges" },
  { href: "/data", label: "Data" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 items-center justify-center px-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
