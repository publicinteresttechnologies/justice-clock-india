import { CaseTypeList } from "@/components/CaseTypeList";
import { SectionHeader } from "@/components/SectionHeader";
import { caseTypes } from "@/lib/data";

export default function CaseTypesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        description="Mobile-first cards showing approximate case-age-to-judgment metrics by case type."
        title="Case Types"
      />
      <CaseTypeList caseTypes={caseTypes} />
    </div>
  );
}
