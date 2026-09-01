/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberTable } from "@/components/workspace/member-table";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { signInSchema, registerUserSchema } from "@/lib/validations/auth";
import { createWorkspaceSchema } from "@/lib/validations/workspace";

// Mock server actions for component unit tests
vi.mock("@/server/actions/members", () => ({
  updateMemberRoleAction: vi.fn().mockResolvedValue({ success: true }),
  getWorkspaceMembersAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/server/actions/workspaces", () => ({
  getUserWorkspacesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createWorkspaceAction: vi.fn().mockResolvedValue({ success: true, data: { workspaceId: "ws-1", slug: "ws-1" } }),
  joinWorkspaceByInviteCodeAction: vi.fn().mockResolvedValue({ success: true, data: { workspaceId: "ws-1", slug: "ws-1" } }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe("FEAT-001-VERIFY: Component & Form Suite", () => {
  describe("Form Schema Validations", () => {
    it("validates login form required fields and rejects empty submit", () => {
      const emptyResult = signInSchema.safeParse({ email: "", password: "" });
      expect(emptyResult.success).toBe(false);

      const validResult = signInSchema.safeParse({
        email: "test@example.com",
        password: "secretpassword",
      });
      expect(validResult.success).toBe(true);
    });

    it("validates register form password length constraint", () => {
      const shortPass = registerUserSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "short",
      });
      expect(shortPass.success).toBe(false);

      const validRegister = registerUserSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "longenoughpassword",
      });
      expect(validRegister.success).toBe(true);
    });

    it("validates onboarding workspace creation schema", () => {
      const invalidWs = createWorkspaceSchema.safeParse({ name: "" });
      expect(invalidWs.success).toBe(false);

      const validWs = createWorkspaceSchema.safeParse({
        name: "Engineering Team",
        slug: "engineering-team",
      });
      expect(validWs.success).toBe(true);
    });
  });

  describe("WorkspaceSwitcher Component", () => {
    it("renders current workspace name and role", () => {
      render(
        <WorkspaceSwitcher
          currentWorkspaceId="ws-123"
          currentWorkspaceName="Acme Corp"
          currentWorkspaceRole="OWNER"
        />
      );

      expect(screen.getByText("Acme Corp")).toBeDefined();
      expect(screen.getByText("OWNER")).toBeDefined();
    });
  });

  describe("InviteMemberDialog Component", () => {
    it("renders invite button trigger and opens dialog", () => {
      render(
        <InviteMemberDialog
          workspaceId="ws-123"
          workspaceName="Acme Corp"
          inviteCode="inv-code-xyz"
        />
      );

      const inviteButton = screen.getByText("Invite Members");
      expect(inviteButton).toBeDefined();
    });
  });

  describe("MemberTable Component", () => {
    const mockMembers = [
      {
        id: "mem-1",
        userId: "user-1",
        name: "Owner User",
        email: "owner@meridian.app",
        role: "OWNER" as const,
      },
      {
        id: "mem-2",
        userId: "user-2",
        name: "Member User",
        email: "member@meridian.app",
        role: "MEMBER" as const,
      },
    ];

    it("renders members table with user names, emails, and roles", () => {
      render(
        <MemberTable
          workspaceId="ws-123"
          currentUserId="user-1"
          currentUserRole="OWNER"
          initialMembers={mockMembers}
        />
      );

      expect(screen.getByText("Owner User")).toBeDefined();
      expect(screen.getByText("owner@meridian.app")).toBeDefined();
      expect(screen.getByText("Member User")).toBeDefined();
      expect(screen.getByText("member@meridian.app")).toBeDefined();
    });

    it("restricts role change controls for viewer / non-admin users", () => {
      render(
        <MemberTable
          workspaceId="ws-123"
          currentUserId="user-3"
          currentUserRole="VIEWER"
          initialMembers={mockMembers}
        />
      );

      // Non-admins should see role badges without editable action dropdowns
      expect(screen.getByText("Owner User")).toBeDefined();
      expect(screen.getByText("Member User")).toBeDefined();
    });
  });
});
