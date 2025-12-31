export type UUID = string;

export type ISODate = string; // "2025-12-31"

export type ISODateTime = string; // "2025-12-31T18:22:00Z"

export type Confidence = "low" | "medium" | "high";

export type VerificationStatus =
  | "unverified"
  | "self_reported"
  | "pending_review"
  | "verified";

export type FitBand = "likely" | "target" | "reach";

export type Priority = "low" | "medium" | "high";

export type MoneyUSD = number;
