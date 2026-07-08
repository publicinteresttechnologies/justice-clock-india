import { notFound } from "next/navigation";
import { CaveatBox } from "@/components/CaveatBox";
import { DataCard } from "@/components/DataCard";
import { SectionHeader } from "@/components/SectionHeader";
import researchIndex from "../../../../data/research/posts/index.json";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return researchIndex.map((post) => ({ slug: post.slug }));
}

export default async function ResearchPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = researchIndex.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader description={post.question} title={post.title} />
      <CaveatBox>
        Research posts are not legal advice and do not provide case prediction.
      </CaveatBox>
      <DataCard title="Short Answer">
        <p className="text-sm leading-6 text-slate-700">{post.shortAnswer}</p>
      </DataCard>
      <DataCard title="Methodology">
        <p className="text-sm leading-6 text-slate-700">{post.methodology}</p>
      </DataCard>
      <DataCard title="Limitations">
        <p className="text-sm leading-6 text-slate-700">{post.limitations}</p>
      </DataCard>
      <DataCard title="Data Files">
        <ul className="space-y-2 text-sm font-semibold text-amber-900">
          {post.dataFiles.map((file) => (
            <li key={file}>
              <a href={file}>{file}</a>
            </li>
          ))}
        </ul>
      </DataCard>
    </div>
  );
}
