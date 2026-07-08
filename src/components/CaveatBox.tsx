import type { ReactNode } from "react";

type CaveatBoxProps = {
  children: ReactNode;
};

export function CaveatBox({ children }: CaveatBoxProps) {
  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      {children}
    </aside>
  );
}
