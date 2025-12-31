import { UUID, Confidence, ISODate, MoneyUSD, Priority } from "./index";

export interface ScholarshipProfile {
  id: UUID;
  name: string;
  provider?: string;
  awardMin?: MoneyUSD;
  awardMax?: MoneyUSD;
  deadline?: ISODate;
  website?: string;
  // Hard rules should be deterministic later.
  eligibilitySummary?: string;
  // Soft preferences can be scored later.
  preferenceSummary?: string;
}

export interface ScholarshipMatch {
  id: UUID;
  scholarshipId: UUID;
  scholarshipName: string;
  eligibilityConfidence: Confidence; // "high" if rules clearly satisfied
  competitivenessEstimate: "low" | "medium" | "high";
  matchScore: number; // 0–100
  priority: Priority; // based on deadline + payoff + fit
  reasons: string[];
  deadline?: ISODate;
  awardRange?: {
    min?: MoneyUSD;
    max?: MoneyUSD;
  };
}
