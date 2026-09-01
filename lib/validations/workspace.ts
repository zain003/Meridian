import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name cannot exceed 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens")
    .optional(),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
    message: "Role must be ADMIN, MEMBER, or VIEWER",
  }),
});

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  targetUserId: z.string().min(1, "Target User ID is required"),
  newRole: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"], {
    message: "Invalid role specified",
  }),
});

export const joinWorkspaceSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type JoinWorkspaceInput = z.infer<typeof joinWorkspaceSchema>;
