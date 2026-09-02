/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = "/ws-1";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/server/actions/workspaces", () => ({
  getUserWorkspacesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createWorkspaceAction: vi.fn().mockResolvedValue({ success: true, data: { workspaceId: "ws-1", slug: "ws-1" } }),
  joinWorkspaceByInviteCodeAction: vi.fn().mockResolvedValue({ success: true, data: { workspaceId: "ws-1", slug: "ws-1" } }),
}));

vi.mock("@/server/actions/members", () => ({
  updateMemberRoleAction: vi.fn().mockResolvedValue({ success: true }),
  getWorkspaceMembersAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

const mockCreateProjectAction = vi.fn();
const mockGetWorkspaceProjectsAction = vi.fn();
const mockCreateColumnAction = vi.fn();
const mockDeleteColumnAction = vi.fn();
const mockGetProjectBoardsAction = vi.fn();
const mockReorderColumnsAction = vi.fn();

vi.mock("@/server/actions/projects", () => ({
  createProjectAction: (...args: unknown[]) => mockCreateProjectAction(...args),
  getWorkspaceProjectsAction: (...args: unknown[]) => mockGetWorkspaceProjectsAction(...args),
}));

vi.mock("@/server/actions/boards", () => ({
  createColumnAction: (...args: unknown[]) => mockCreateColumnAction(...args),
  deleteColumnAction: (...args: unknown[]) => mockDeleteColumnAction(...args),
  getProjectBoardsAction: (...args: unknown[]) => mockGetProjectBoardsAction(...args),
  reorderColumnsAction: (...args: unknown[]) => mockReorderColumnsAction(...args),
}));

import { Sidebar } from "@/components/workspace/sidebar";
import { CreateProjectDialog, generateProjectKey } from "@/components/projects/create-project-dialog";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardColumnHeader } from "@/components/boards/board-column-header";
import { AddColumnButton } from "@/components/boards/add-column-button";

describe("Projects & Boards Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/ws-1";
    mockSearchParams = new URLSearchParams();
  });

  describe("generateProjectKey Helper", () => {
    it("generates acronym for multi-word project names", () => {
      expect(generateProjectKey("Mobile App")).toBe("MA");
      expect(generateProjectKey("Core Platform Engine")).toBe("CPE");
      expect(generateProjectKey("Marketing Web Platform")).toBe("MWP");
    });

    it("generates 3-letter uppercase prefix for single-word names", () => {
      expect(generateProjectKey("Meridian")).toBe("MER");
      expect(generateProjectKey("Operations")).toBe("OPE");
    });

    it("handles empty or special character strings gracefully", () => {
      expect(generateProjectKey("")).toBe("");
      expect(generateProjectKey("!@#")).toBe("");
    });
  });

  describe("Sidebar Component", () => {
    const mockWorkspace = {
      id: "ws-1",
      name: "Acme Corp",
      slug: "acme-corp",
      inviteCode: "inv-123",
    };

    const mockProjects = [
      { id: "p-1", name: "Mobile App", key: "MOB", description: null },
      { id: "p-2", name: "Core Engine", key: "ENG", description: "Backend services" },
    ];

    const mockUser = {
      id: "u-1",
      name: "Jane Doe",
      email: "jane@acme.com",
    };

    it("renders workspace projects and their keys", () => {
      render(
        <Sidebar
          workspace={mockWorkspace}
          role="OWNER"
          projects={mockProjects}
          user={mockUser}
          signOutAction={vi.fn()}
        />
      );

      expect(screen.getByText("Mobile App")).toBeDefined();
      expect(screen.getByText("MOB")).toBeDefined();
      expect(screen.getByText("Core Engine")).toBeDefined();
      expect(screen.getByText("ENG")).toBeDefined();
    });

    it("highlights active project when pathname matches", () => {
      mockPathname = "/ws-1/projects/p-1";

      render(
        <Sidebar
          workspace={mockWorkspace}
          role="OWNER"
          projects={mockProjects}
          user={mockUser}
          signOutAction={vi.fn()}
        />
      );

      const activeLink = screen.getByTitle("Mobile App");
      expect(activeLink.className).toContain("text-primary");
    });

    it("renders empty state prompt when no projects exist", () => {
      render(
        <Sidebar
          workspace={mockWorkspace}
          role="MEMBER"
          projects={[]}
          user={mockUser}
          signOutAction={vi.fn()}
        />
      );

      expect(screen.getByText("No projects yet")).toBeDefined();
      expect(screen.getByText("Create first project")).toBeDefined();
    });

    it("hides create project triggers for read-only VIEWER role", () => {
      render(
        <Sidebar
          workspace={mockWorkspace}
          role="VIEWER"
          projects={mockProjects}
          user={mockUser}
          signOutAction={vi.fn()}
        />
      );

      expect(screen.queryByTitle("Create Project")).toBeNull();
    });
  });

  describe("CreateProjectDialog Component", () => {
    it("auto-generates project key when typing project name and creates project on submit", async () => {
      mockCreateProjectAction.mockResolvedValue({
        success: true,
        data: { projectId: "proj-new-1", defaultBoardId: "board-1" },
      });

      render(
        <CreateProjectDialog
          workspaceId="ws-1"
          trigger={<button>Open Dialog</button>}
        />
      );

      fireEvent.click(screen.getByText("Open Dialog"));

      expect(screen.getByText("Create New Project")).toBeDefined();

      const nameInput = screen.getByPlaceholderText("e.g. Mobile Application, Core Platform");
      fireEvent.change(nameInput, { target: { value: "Mobile Application" } });

      const keyInput = screen.getByPlaceholderText("e.g. MOB, MER") as HTMLInputElement;
      expect(keyInput.value).toBe("MA");

      const submitButton = screen.getByRole("button", { name: "Create Project" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProjectAction).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: "ws-1",
            name: "Mobile Application",
            key: "MA",
          })
        );
        expect(mockPush).toHaveBeenCalledWith("/ws-1/projects/proj-new-1");
      });
    });

    it("displays error message if duplicate key is returned", async () => {
      mockCreateProjectAction.mockResolvedValue({
        success: false,
        error: "KEY_ALREADY_EXISTS",
      });

      render(
        <CreateProjectDialog
          workspaceId="ws-1"
          trigger={<button>Open Dialog</button>}
        />
      );

      fireEvent.click(screen.getByText("Open Dialog"));

      const nameInput = screen.getByPlaceholderText("e.g. Mobile Application, Core Platform");
      fireEvent.change(nameInput, { target: { value: "Core Engine" } });

      const submitButton = screen.getByRole("button", { name: "Create Project" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("A project with this key already exists in this workspace")).toBeDefined();
      });
    });
  });

  describe("BoardHeader Component", () => {
    it("renders project title, key badge, and view switcher tabs", () => {
      render(
        <BoardHeader
          projectId="proj-1"
          projectName="Customer Portal"
          projectKey="CUS"
          projectDescription="Self-service client dashboard"
          workspaceId="ws-1"
          currentView="kanban"
        />
      );

      expect(screen.getByText("Customer Portal")).toBeDefined();
      expect(screen.getByText("CUS")).toBeDefined();
      expect(screen.getByText("Self-service client dashboard")).toBeDefined();
      expect(screen.getByText("Kanban")).toBeDefined();
      expect(screen.getByText("List")).toBeDefined();
      expect(screen.getByText("Calendar")).toBeDefined();
    });

    it("updates URL search params when switching views", () => {
      render(
        <BoardHeader
          projectId="proj-1"
          projectName="Customer Portal"
          projectKey="CUS"
          workspaceId="ws-1"
          currentView="kanban"
        />
      );

      const listTab = screen.getByRole("tab", { name: /list/i });
      fireEvent.click(listTab);

      expect(mockPush).toHaveBeenCalledWith("/ws-1?view=list");
    });
  });

  describe("BoardColumnHeader Component", () => {
    it("renders column name and task count badge", () => {
      render(
        <BoardColumnHeader
          columnId="col-1"
          columnName="In Progress"
          taskCount={4}
          canManage={true}
        />
      );

      expect(screen.getByText("In Progress")).toBeDefined();
      expect(screen.getByText("4")).toBeDefined();
    });

    it("opens delete confirmation modal when delete column is triggered", async () => {
      render(
        <BoardColumnHeader
          columnId="col-1"
          columnName="Done"
          taskCount={2}
          canManage={true}
        />
      );

      const optionsBtn = screen.getByTitle("Column options");
      fireEvent.pointerDown(optionsBtn);
      fireEvent.click(optionsBtn);

      await waitFor(() => {
        expect(screen.getByText("Delete Column")).toBeDefined();
      });

      const deleteOption = screen.getByText("Delete Column");
      fireEvent.click(deleteOption);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete the column/)).toBeDefined();
        expect(screen.getByText(/Tasks will be moved to the Backlog column/)).toBeDefined();
      });
    });
  });

  describe("AddColumnButton Component", () => {
    it("opens inline form and creates new column on submit", async () => {
      mockCreateColumnAction.mockResolvedValue({
        success: true,
        data: { columnId: "col-new-123" },
      });

      const onColumnCreated = vi.fn();

      render(
        <AddColumnButton
          boardId="board-1"
          canManage={true}
          onColumnCreated={onColumnCreated}
        />
      );

      const trigger = screen.getByText("Add Column");
      fireEvent.click(trigger);

      const input = screen.getByPlaceholderText("Enter column name...");
      fireEvent.change(input, { target: { value: "Quality Assurance" } });

      const submitBtn = screen.getByRole("button", { name: "Add Column" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateColumnAction).toHaveBeenCalledWith({
          boardId: "board-1",
          name: "Quality Assurance",
        });
        expect(onColumnCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Quality Assurance",
          })
        );
      });
    });

    it("closes inline form when Cancel is clicked", () => {
      render(<AddColumnButton boardId="board-1" canManage={true} />);

      fireEvent.click(screen.getByText("Add Column"));
      expect(screen.getByPlaceholderText("Enter column name...")).toBeDefined();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByPlaceholderText("Enter column name...")).toBeNull();
      expect(screen.getByText("Add Column")).toBeDefined();
    });
  });
});
