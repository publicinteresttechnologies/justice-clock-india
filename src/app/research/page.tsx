import Link from "next/link";
import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";
import researchIndex from "../../../data/research/posts/index.json";

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="Draft and published research notes built from public Supreme Court metadata."
        title="Research"
      />
      <div className="space-y-3">
        {researchIndex.map((post) => (
          <DataCard
            href={`/research/${post.slug}`}
            key={post.slug}
            subtitle={`Status: ${post.status}`}
            title={post.title}
          >
            <p className="text-sm leading-6 text-slate-700">{post.shortAnswer}</p>
          </DataCard>
        ))}
      </div>
      <Link className="text-sm font-semibold text-amber-900" href="/methodology">
        Read methodology
      </Link>
    </div>
  );
}
