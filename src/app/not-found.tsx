import Link from "next/link";
import { DataCard } from "@/components/DataCard";

export default function NotFound() {
  return (
    <div className="space-y-6">
      <DataCard
        subtitle="The requested public data page does not exist in this build."
        title="Page not found"
      >
        <Link className="text-sm font-semibold text-amber-900" href="/">
          Return to Justice Clock India
        </Link>
      </DataCard>
    </div>
  );
}
