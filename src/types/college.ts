import { UUID, Confidence, FitBand, ISODate, MoneyUSD } from "./index";

export interface CollegeProgram {
  name: string; // "Computer Science"
  department?: string;
  notes?: string;
}

export interface CollegeProfile {
  id: UUID;
  name: string;
  city?: string;
  state?: string;
  type?: "public" | "private" | "other";
  size?: "small" | "medium" | "large";
  setting?: "urban" | "suburban" | "rural";
  website?: string;
  programs?: CollegeProgram[];
  // "Admissions lens" weights (0–1). These are placeholders for v1 scoring.
  priorities?: {
    academicsWeight?: number;
    leadershipWeight?: number;
    serviceWeight?: number;
    athleticsWeight?: number;
    fitWeight?: number;
    notes?: string;
  };
}

export interface CollegeRecommendation {
  id: UUID;
  collegeId: UUID;
  collegeName: string;
  fitBand: FitBand; // likely/target/reach
  overallScore: number; // 0–100
  confidence: Confidence; // based on data completeness + verification
  reasons: string[]; // bullets: why it matches
  risks?: string[]; // bullets: what could hurt chances
  estimatedCost?: {
    tuitionAndFees?: MoneyUSD;
    totalCostOfAttendance?: MoneyUSD;
    notes?: string;
  };
  deadlines?: {
    earlyAction?: ISODate;
    earlyDecision?: ISODate;
    regularDecision?: ISODate;
  };
}
