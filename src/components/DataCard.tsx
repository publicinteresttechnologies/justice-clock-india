import Link from "next/link";
import type { ReactNode } from "react";

type DataCardProps = {
  title: string;
  subtitle?: string;
  href?: string;
  children?: ReactNode;
};

export function DataCard({ title, subtitle, href, children }: DataCardProps) {
  const content = (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-normal text-slate-950">
          {title}
        </h3>
        {subtitle ? (
          <p className="text-sm leading-6 text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-amber-700">
      {content}
    </Link>
  );
}
