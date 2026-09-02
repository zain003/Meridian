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
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { BoardHeader } from "@/components/boards/board-header";
import { AddColumnButton } from "@/components/boards/add-column-button";

describe("FEAT-002-VERIFY: Board Scaffold Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/ws-1";
    mockSearchParams = new URLSearchParams();
  });

  it("project sidebar renders active projects", () => {
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

  it("project creation dialog submits and auto-generates key", async () => {
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

  it("view switcher updates URL query parameters", () => {
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

  it("add column inline form triggers createColumnAction", async () => {
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
});
