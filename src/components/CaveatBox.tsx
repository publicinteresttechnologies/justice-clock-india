type CaveatBoxProps = {
  title?: string;
  children: React.ReactNode;
};

export function CaveatBox({ title = "Caveat", children }: CaveatBoxProps) {
  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <p className="mb-1 font-black">{title}</p>
      <div>{children}</div>
    </aside>
  );
}
