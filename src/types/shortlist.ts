import { ISODate, UUID } from "./index";

export type CollegeStatus = "interested" | "applying" | "applied" | "not_now";

export interface ShortlistItem {
  id: UUID;              // collegeId
  collegeName: string;
  status: CollegeStatus;
  notes?: string;
  updatedAt: ISODate;
}
