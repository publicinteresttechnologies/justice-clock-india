import courtClockJson from "../../public/data/court-clock.json";
import caseTypesJson from "../../public/data/case-types.json";
import dataMetadataJson from "../../public/data/data-metadata.json";
import judgesJson from "../../public/data/judges.json";
import siteSummaryJson from "../../public/data/site-summary.json";
import sourcesJson from "../../public/data/sources.json";
import {
  caseTypeMetricsSchema,
  courtClockSchema,
  judgeProfilesSchema,
  justiceClockDatasetMetadataSchema,
  siteSummarySchema,
  sourceCardsSchema,
} from "./schemas";

export const courtClock = courtClockSchema.parse(courtClockJson);
export const caseTypes = caseTypeMetricsSchema.parse(caseTypesJson);
export const judges = judgeProfilesSchema.parse(judgesJson);
export const dataMetadata = justiceClockDatasetMetadataSchema.parse(dataMetadataJson);
export const sources = sourceCardsSchema.parse(sourcesJson);
export const siteSummary = siteSummarySchema.parse(siteSummaryJson);
