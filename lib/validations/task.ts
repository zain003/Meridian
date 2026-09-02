import { z } from "zod";

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriorityType = z.infer<typeof taskPriorityEnum>;

export const createTaskSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  columnId: z.string().min(1, "Column ID is required"),
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be 200 characters or less"),
  description: z
    .string()
    .max(10000, "Description must be 10000 characters or less")
    .optional()
    .nullable(),
  priority: taskPriorityEnum.optional().default("MEDIUM"),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional().default([]),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const moveTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  sourceColumnId: z.string().min(1, "Source column ID is required"),
  destinationColumnId: z.string().min(1, "Destination column ID is required"),
  newOrder: z.number().int().min(0, "Order must be greater than or equal to 0"),
});

export type MoveTaskInput = z.input<typeof moveTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(10000, "Description must be 10000 characters or less")
    .optional()
    .nullable(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  columnId: z.string().optional(),
  completedAt: z.coerce.date().optional().nullable(),
});

export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export type DeleteTaskInput = z.input<typeof deleteTaskSchema>;

export const createSubtaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  title: z
    .string()
    .min(1, "Subtask title is required")
    .max(200, "Subtask title must be 200 characters or less"),
});

export type CreateSubtaskInput = z.input<typeof createSubtaskSchema>;

export const toggleSubtaskSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID is required"),
  isDone: z.boolean(),
});

export type ToggleSubtaskInput = z.input<typeof toggleSubtaskSchema>;

export const deleteSubtaskSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID is required"),
});

export type DeleteSubtaskInput = z.input<typeof deleteSubtaskSchema>;

export const createCommentSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(5000, "Comment must be 5000 characters or less"),
});

export type CreateCommentInput = z.input<typeof createCommentSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
});

export type DeleteCommentInput = z.input<typeof deleteCommentSchema>;

export const createLabelSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z
    .string()
    .min(1, "Label name is required")
    .max(50, "Label name must be 50 characters or less"),
  color: z
    .string()
    .min(1, "Color code is required")
    .max(30, "Color code must be 30 characters or less"),
});

export type CreateLabelInput = z.input<typeof createLabelSchema>;
