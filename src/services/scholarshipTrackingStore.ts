import { ScholarshipTrackingItem, ScholarshipStatus } from "../types/scholarshipTracking";

const KEY = "college_compass_scholarships_v1";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loadScholarships(): Record<string, ScholarshipTrackingItem> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ScholarshipTrackingItem>;
  } catch {
    return {};
  }
}

export function saveScholarships(map: Record<string, ScholarshipTrackingItem>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function upsertScholarship(
  map: Record<string, ScholarshipTrackingItem>,
  scholarshipId: string,
  scholarshipName: string,
  status: ScholarshipStatus = "to_apply"
): Record<string, ScholarshipTrackingItem> {
  const next: Record<string, ScholarshipTrackingItem> = { ...map };
  next[scholarshipId] = {
    id: scholarshipId,
    scholarshipName,
    status,
    updatedAt: todayISO(),
    notes: next[scholarshipId]?.notes ?? "",
  };
  return next;
}

export function setScholarshipStatus(
  map: Record<string, ScholarshipTrackingItem>,
  scholarshipId: string,
  status: ScholarshipStatus
): Record<string, ScholarshipTrackingItem> {
  const item = map[scholarshipId];
  if (!item) return map;
  return {
    ...map,
    [scholarshipId]: { ...item, status, updatedAt: todayISO() },
  };
}

export function setScholarshipNotes(
  map: Record<string, ScholarshipTrackingItem>,
  scholarshipId: string,
  notes: string
): Record<string, ScholarshipTrackingItem> {
  const item = map[scholarshipId];
  if (!item) return map;
  return {
    ...map,
    [scholarshipId]: { ...item, notes, updatedAt: todayISO() },
  };
}
