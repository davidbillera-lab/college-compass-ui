import { UUID, ISODate, VerificationStatus } from "./index";

export type TestType = "SAT" | "ACT" | "AP" | "IB" | "Other";

export interface VerifiedDocument {
  id: UUID;
  kind:
    | "transcript"
    | "test_score"
    | "recommendation"
    | "award"
    | "certificate"
    | "other";
  filename?: string;
  uploadedAt: ISODate;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export interface AcademicProfile {
  gpa?: {
    value: number; // e.g., 3.85
    scale?: 4 | 5;
    weighted?: boolean;
    verificationStatus: VerificationStatus;
  };
  classRank?: {
    value?: number; // e.g., 12
    of?: number; // e.g., 350
    verificationStatus: VerificationStatus;
  };
  rigor?: {
    honorsCount?: number;
    apCount?: number;
    ibCount?: number;
    dualEnrollmentCount?: number;
    verificationStatus: VerificationStatus;
  };
}

export interface TestScore {
  id: UUID;
  type: TestType;
  date?: ISODate;
  composite?: number;
  breakdown?: Record<string, number>; // { Math: 720, EBRW: 690 }
  verificationStatus: VerificationStatus;
}

export interface ActivityImpact {
  description: string; // "Raised $5,000 for..."
  metric?: string; // "$5,000", "120 hours", "3 events"
}

export interface StudentActivity {
  id: UUID;
  category:
    | "athletics"
    | "leadership"
    | "service"
    | "work"
    | "research"
    | "arts"
    | "clubs"
    | "family"
    | "other";
  name: string; // "Varsity Soccer", "Mock Trial"
  role?: string; // "Captain", "Founder"
  grades?: string[]; // ["10", "11", "12"]
  hoursPerWeek?: number;
  weeksPerYear?: number;
  impacts?: ActivityImpact[];
  proofDocIds?: UUID[]; // references VerifiedDocument ids
  verificationStatus: VerificationStatus;
}

export interface StudentPreferences {
  intendedMajors?: string[]; // ["Political Science", "Pre-Law"]
  regions?: string[]; // ["West", "Midwest"]
  states?: string[]; // ["CO", "CA"]
  schoolSize?: "small" | "medium" | "large" | "no_preference";
  setting?: "urban" | "suburban" | "rural" | "no_preference";
  budgetSensitivity?: "low" | "medium" | "high";
  distanceFromHome?: "commutable" | "within_state" | "out_of_state" | "any";
}

export interface StudentProfile {
  id: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
  firstName?: string;
  lastName?: string;
  graduationYear?: number;
  location?: {
    city?: string;
    state?: string;
  };
  academics?: AcademicProfile;
  tests?: TestScore[];
  activities?: StudentActivity[];
  documents?: VerifiedDocument[];
  narrative?: {
    tagline?: string; // 1 sentence personal brand
    themes?: string[]; // ["service", "leadership", "resilience"]
    bioShort?: string; // 50–120 words
  };
  preferences?: StudentPreferences;
}
