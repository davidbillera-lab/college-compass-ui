import { ShortlistItem, CollegeStatus } from "../types/shortlist";

const KEY = "college_compass_shortlist_v1";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loadShortlist(): Record<string, ShortlistItem> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ShortlistItem>;
  } catch {
    return {};
  }
}

export function saveShortlist(map: Record<string, ShortlistItem>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function upsertShortlistItem(
  map: Record<string, ShortlistItem>,
  collegeId: string,
  collegeName: string,
  status: CollegeStatus = "interested"
): Record<string, ShortlistItem> {
  const next: Record<string, ShortlistItem> = { ...map };
  next[collegeId] = {
    id: collegeId,
    collegeName,
    status,
    updatedAt: todayISO(),
    notes: next[collegeId]?.notes ?? "",
  };
  return next;
}

export function setStatus(
  map: Record<string, ShortlistItem>,
  collegeId: string,
  status: CollegeStatus
): Record<string, ShortlistItem> {
  const item = map[collegeId];
  if (!item) return map;
  return {
    ...map,
    [collegeId]: {
      ...item,
      status,
      updatedAt: todayISO(),
    },
  };
}

export function setNotes(
  map: Record<string, ShortlistItem>,
  collegeId: string,
  notes: string
): Record<string, ShortlistItem> {
  const item = map[collegeId];
  if (!item) return map;
  return {
    ...map,
    [collegeId]: {
      ...item,
      notes,
      updatedAt: todayISO(),
    },
  };
}
