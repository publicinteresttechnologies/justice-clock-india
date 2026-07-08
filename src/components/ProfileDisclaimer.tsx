export function ProfileDisclaimer() {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
      <p className="font-semibold text-amber-950">Public profile caveat</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Not legal advice.</li>
        <li>Not official Supreme Court data.</li>
        <li>Metadata profile only.</li>
        <li>Not a performance rating.</li>
      </ul>
    </div>
  );
}
