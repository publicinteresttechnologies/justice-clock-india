import courtClockJson from "../../public/data/court-clock.json";
import caseTypesJson from "../../public/data/case-types.json";
import justiceClockDataJson from "../../public/data/justice-clock-data.json";
import judgesJson from "../../public/data/judges.json";
import judgmentsJson from "../../public/data/judgments.json";
import siteSummaryJson from "../../public/data/site-summary.json";
import sourcesJson from "../../public/data/sources.json";
import {
  caseTypeMetricsSchema,
  courtClockSchema,
  justiceClockDatasetSchema,
  judgeProfilesSchema,
  judgmentsSchema,
  siteSummarySchema,
  sourceCardsSchema,
} from "./schemas";

export const courtClock = courtClockSchema.parse(courtClockJson);
export const caseTypes = caseTypeMetricsSchema.parse(caseTypesJson);
export const judges = judgeProfilesSchema.parse(judgesJson);
export const judgments = judgmentsSchema.parse(judgmentsJson);
export const justiceClockData = justiceClockDatasetSchema.parse(
  justiceClockDataJson,
);
export const dataMetadata = justiceClockData.metadata;
export const sources = sourceCardsSchema.parse(sourcesJson);
export const siteSummary = siteSummarySchema.parse(siteSummaryJson);
