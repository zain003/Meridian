import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name cannot exceed 50 characters"),
  key: z
    .string()
    .min(2, "Project key must be at least 2 characters")
    .max(10, "Project key cannot exceed 10 characters")
    .regex(/^[A-Za-z0-9]+$/, "Project key must contain only letters and numbers")
    .transform((val) => val.toUpperCase().trim()),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const createColumnSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name cannot exceed 50 characters"),
  order: z.number().int().nonnegative("Order must be a non-negative integer").optional(),
});

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  columnIds: z
    .array(z.string().min(1, "Column ID cannot be empty"))
    .min(1, "At least one column ID is required"),
});

export const deleteColumnSchema = z.object({
  columnId: z.string().min(1, "Column ID is required"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;
