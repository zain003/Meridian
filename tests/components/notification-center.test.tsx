/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockGetUserNotificationsAction = vi.fn();
const mockMarkNotificationAsReadAction = vi.fn();
const mockMarkAllNotificationsAsReadAction = vi.fn();

vi.mock("@/server/actions/notifications", () => ({
  getUserNotificationsAction: (...args: unknown[]) =>
    mockGetUserNotificationsAction(...args),
  markNotificationAsReadAction: (...args: unknown[]) =>
    mockMarkNotificationAsReadAction(...args),
  markAllNotificationsAsReadAction: (...args: unknown[]) =>
    mockMarkAllNotificationsAsReadAction(...args),
}));

import { NotificationBell } from "@/components/workspace/notification-bell";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { formatRelativeTime } from "@/components/notifications/notification-item";
import type { Notification } from "@prisma/client";

describe("Notification Center Components (FEAT-006-FE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserNotificationsAction.mockResolvedValue({ success: true, data: [] });
    mockMarkNotificationAsReadAction.mockResolvedValue({ success: true });
    mockMarkAllNotificationsAsReadAction.mockResolvedValue({ success: true });
  });

  const mockNotifications: Notification[] = [
    {
      id: "notif-1",
      workspaceId: "ws-1",
      userId: "user-1",
      title: "Task Assigned",
      message: "You were assigned to 'Implement Auth Flow'",
      entityType: "TASK",
      entityId: "task-100",
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5m ago
    },
    {
      id: "notif-2",
      workspaceId: "ws-1",
      userId: "user-1",
      title: "New Comment",
      message: "Sarah commented: 'Looks great!'",
      entityType: "COMMENT",
      entityId: "task-100",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    },
    {
      id: "notif-3",
      workspaceId: "ws-1",
      userId: "user-1",
      title: "Automation Rule Fired",
      message: "Task was moved to Done",
      entityType: "RULE",
      entityId: "rule-200",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1d ago
    },
  ];

  describe("1. Relative Time Formatter", () => {
    it("formats relative times correctly", () => {
      const now = Date.now();
      expect(formatRelativeTime(new Date(now - 10 * 1000))).toBe("Just now");
      expect(formatRelativeTime(new Date(now - 5 * 60 * 1000))).toBe("5m ago");
      expect(formatRelativeTime(new Date(now - 3 * 60 * 60 * 1000))).toBe("3h ago");
      expect(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60 * 1000))).toBe("2d ago");
    });
  });

  describe("2. NotificationBell Component", () => {
    it("renders unread badge count when unread notifications > 0", () => {
      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={mockNotifications}
        />
      );

      const badge = screen.getByTestId("notification-unread-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("2"); // 2 unread in mock
    });

    it("hides unread badge when there are zero unread notifications", () => {
      const allReadNotifications = mockNotifications.map((n) => ({
        ...n,
        isRead: true,
      }));

      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={allReadNotifications}
        />
      );

      expect(
        screen.queryByTestId("notification-unread-badge")
      ).not.toBeInTheDocument();
    });

    it("renders '99+' badge when unread count exceeds 99", () => {
      const manyNotifications: Notification[] = Array.from({ length: 105 }, (_, i) => ({
        id: `notif-${i}`,
        workspaceId: "ws-1",
        userId: "user-1",
        title: `Task ${i}`,
        message: "Message",
        entityType: "TASK",
        entityId: `task-${i}`,
        isRead: false,
        createdAt: new Date(),
      }));

      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={manyNotifications}
        />
      );

      const badge = screen.getByTestId("notification-unread-badge");
      expect(badge).toHaveTextContent("99+");
    });

    it("fetches notifications when opened if none provided initially", async () => {
      mockGetUserNotificationsAction.mockResolvedValue({
        success: true,
        data: mockNotifications,
      });

      render(<NotificationBell workspaceId="ws-1" />);

      await waitFor(() => {
        expect(mockGetUserNotificationsAction).toHaveBeenCalledWith("ws-1");
      });
    });
  });

  describe("3. NotificationPopover & Item Rendering", () => {
    it("renders notification items with entity icons, titles, and relative timestamps", () => {
      render(
        <NotificationPopover
          notifications={mockNotifications}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
        />
      );

      expect(screen.getByText("Task Assigned")).toBeInTheDocument();
      expect(
        screen.getByText("You were assigned to 'Implement Auth Flow'")
      ).toBeInTheDocument();
      expect(screen.getByText("New Comment")).toBeInTheDocument();
      expect(screen.getByText("Automation Rule Fired")).toBeInTheDocument();

      // Entity icons
      expect(screen.getByTestId("icon-task")).toBeInTheDocument();
      expect(screen.getByTestId("icon-comment")).toBeInTheDocument();
      expect(screen.getByTestId("icon-rule")).toBeInTheDocument();

      // Unread dots (2 unread items)
      const unreadDots = screen.getAllByTestId("unread-dot");
      expect(unreadDots).toHaveLength(2);
    });

    it("renders empty state when there are zero notifications", () => {
      render(
        <NotificationPopover
          notifications={[]}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
        />
      );

      expect(
        screen.getByTestId("notifications-empty-state")
      ).toBeInTheDocument();
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
  });

  describe("4. Mark-As-Read Interactions", () => {
    it("clicking an unread item calls onMarkAsRead and removes unread dot", async () => {
      mockMarkNotificationAsReadAction.mockResolvedValue({ success: true });

      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={mockNotifications}
        />
      );

      // Open popover
      const bellBtn = screen.getByTestId("notification-bell-btn");
      fireEvent.click(bellBtn);

      // Click first unread item
      const item = screen.getByTestId("notification-item-notif-1");
      fireEvent.click(item);

      await waitFor(() => {
        expect(mockMarkNotificationAsReadAction).toHaveBeenCalledWith("notif-1");
      });

      // Badge count should now be 1 (optimistic update)
      const badge = screen.getByTestId("notification-unread-badge");
      expect(badge).toHaveTextContent("1");
    });

    it("clicking 'Mark all read' header action clears all unread indicators", async () => {
      mockMarkAllNotificationsAsReadAction.mockResolvedValue({ success: true });

      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={mockNotifications}
        />
      );

      // Open popover
      const bellBtn = screen.getByTestId("notification-bell-btn");
      fireEvent.click(bellBtn);

      // Click Mark all read
      const markAllBtn = screen.getByTestId("mark-all-read-btn");
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(mockMarkAllNotificationsAsReadAction).toHaveBeenCalledWith("ws-1");
      });

      // Badge should disappear (all read)
      expect(
        screen.queryByTestId("notification-unread-badge")
      ).not.toBeInTheDocument();
    });

    it("redirects user to target route when clicking a notification row", async () => {
      render(
        <NotificationBell
          workspaceId="ws-1"
          initialNotifications={mockNotifications}
        />
      );

      // Open popover
      const bellBtn = screen.getByTestId("notification-bell-btn");
      fireEvent.click(bellBtn);

      // Click task notification
      const taskItem = screen.getByTestId("notification-item-notif-1");
      fireEvent.click(taskItem);

      expect(mockPush).toHaveBeenCalledWith("/ws-1");
    });
  });
});
