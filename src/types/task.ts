import { UUID, ISODate, Priority } from "./index";

export type TaskType =
  | "profile"
  | "essay"
  | "college_app"
  | "scholarship"
  | "recommendation"
  | "test"
  | "portfolio"
  | "other";

export interface TaskItem {
  id: UUID;
  type: TaskType;
  title: string;
  description?: string;
  dueDate?: ISODate;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
}

export interface WeeklyPlan {
  id: UUID;
  weekOf: ISODate;
  tasks: TaskItem[];
}
