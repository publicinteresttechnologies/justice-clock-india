import Link from "next/link";

const navItems = [
  { href: "/", label: "Clock" },
  { href: "/case-types", label: "Case Types" },
  { href: "/judges", label: "Judges" },
  { href: "/data", label: "Data" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-[#f8f5ee]/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-screen-sm grid-cols-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 items-center justify-center px-2 text-center text-sm font-medium text-slate-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
