import { ISODate, UUID } from "./index";

export type ScholarshipStatus =
  | "to_apply"
  | "drafting"
  | "submitted"
  | "won"
  | "not_now";

export interface ScholarshipTrackingItem {
  id: UUID; // scholarshipId
  scholarshipName: string;
  status: ScholarshipStatus;
  notes?: string;
  updatedAt: ISODate;
}
