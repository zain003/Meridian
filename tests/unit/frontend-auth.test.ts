import { describe, it, expect } from "vitest";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/workspace";
import { registerUserSchema, signInSchema } from "@/lib/validations/auth";

describe("Frontend Auth & Workspace Validations", () => {
  describe("signInSchema", () => {
    it("rejects invalid emails", () => {
      const res = signInSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(res.success).toBe(false);
    });

    it("accepts valid email and password", () => {
      const res = signInSchema.safeParse({
        email: "user@meridian.app",
        password: "validPassword123",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("registerUserSchema", () => {
    it("rejects password shorter than 8 chars", () => {
      const res = registerUserSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "short",
      });
      expect(res.success).toBe(false);
    });

    it("accepts valid registration input", () => {
      const res = registerUserSchema.safeParse({
        name: "Alice Smith",
        email: "alice@meridian.app",
        password: "securePassword123",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("createWorkspaceSchema", () => {
    it("rejects short workspace names", () => {
      const res = createWorkspaceSchema.safeParse({
        name: "A",
      });
      expect(res.success).toBe(false);
    });

    it("accepts valid workspace name and custom slug", () => {
      const res = createWorkspaceSchema.safeParse({
        name: "Acme Engineering",
        slug: "acme-eng",
      });
      expect(res.success).toBe(true);
    });

    it("rejects uppercase/symbols in slug", () => {
      const res = createWorkspaceSchema.safeParse({
        name: "Acme",
        slug: "Acme_Engineering!",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("inviteMemberSchema", () => {
    it("accepts valid invite member input", () => {
      const res = inviteMemberSchema.safeParse({
        workspaceId: "ws-123",
        email: "colleague@company.com",
        role: "MEMBER",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid role in invite", () => {
      const res = inviteMemberSchema.safeParse({
        workspaceId: "ws-123",
        email: "colleague@company.com",
        role: "INVALID_ROLE",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("updateMemberRoleSchema", () => {
    it("validates role update payload", () => {
      const res = updateMemberRoleSchema.safeParse({
        workspaceId: "ws-123",
        targetUserId: "user-456",
        newRole: "ADMIN",
      });
      expect(res.success).toBe(true);
    });
  });
});
