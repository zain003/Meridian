export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: UserRole;
}

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export interface RuleCondition {
  field: "status" | "priority" | "assigneeId" | "columnId" | "dueDate";
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "IS_EMPTY" | "IS_NOT_EMPTY";
  value: string | number | boolean | null;
}

export interface RuleAction {
  type: "ASSIGN_USER" | "MOVE_COLUMN" | "SET_PRIORITY" | "ADD_LABEL" | "SEND_NOTIFICATION" | "SEND_EMAIL";
  payload: Record<string, unknown>;
}

export interface RealtimePresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}
