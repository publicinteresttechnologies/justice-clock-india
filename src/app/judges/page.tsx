import { JudgeList } from "@/components/JudgeList";
import { SectionHeader } from "@/components/SectionHeader";
import { judges } from "@/lib/data";

export default function JudgesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="Searchable public metadata profiles from generated judgment records."
        title="Judges"
      />
      <JudgeList judges={judges} />
    </div>
  );
}
