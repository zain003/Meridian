"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskSubtasks } from "@/components/tasks/task-subtasks";
import { TaskComments } from "@/components/tasks/task-comments";
import {
  Trash2,
  Calendar,
  User as UserIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
} from "lucide-react";
import { updateTaskAction, deleteTaskAction } from "@/server/actions/tasks";
import type { TaskItem } from "@/components/tasks/task-card";

export interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  columns?: Array<{ id: string; name: string }>;
  members?: Array<{ id: string; name?: string | null; email?: string | null; image?: string | null }>;
  currentUserId?: string;
  canManage?: boolean;
  onTaskUpdated?: (updatedTask: {
    id: string;
    columnId?: string;
    title?: string;
    description?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: Date | null;
    assigneeId?: string | null;
  }) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  columns = [],
  members = [],
  currentUserId,
  canManage = true,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [title, setTitle] = React.useState(task?.title || "");
  const [description, setDescription] = React.useState(task?.description || "");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">(task?.priority || "MEDIUM");
  const [columnId, setColumnId] = React.useState(task?.columnId || "");
  const [assigneeId, setAssigneeId] = React.useState<string>(task?.assignee?.id || "unassigned");
  const [dueDate, setDueDate] = React.useState<string>(() => {
    if (task?.dueDate) {
      const d = new Date(task.dueDate);
      return d.toISOString().split("T")[0];
    }
    return "";
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<"write" | "preview">("write");

  const [prevTaskId, setPrevTaskId] = React.useState<string | null>(task?.id ?? null);
  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setPriority(task.priority || "MEDIUM");
    setColumnId(task.columnId || "");
    setAssigneeId(task.assignee?.id || "unassigned");
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      setDueDate(d.toISOString().split("T")[0]);
    } else {
      setDueDate("");
    }
  }

  if (!task) return null;

  async function handleTitleBlur() {
    if (!task || title.trim() === task.title) return;
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }

    try {
      await updateTaskAction({
        taskId: task.id,
        title: title.trim(),
      });
      onTaskUpdated?.({ id: task.id, title: title.trim() });
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  }

  async function handleDescriptionBlur() {
    if (!task || description === (task.description || "")) return;

    try {
      await updateTaskAction({
        taskId: task.id,
        description: description.trim() || null,
      });
      onTaskUpdated?.({ id: task.id, description: description.trim() || null });
    } catch (err) {
      console.error("Failed to update description:", err);
    }
  }

  async function handlePriorityChange(newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") {
    setPriority(newPriority);
    if (!task) return;

    try {
      await updateTaskAction({
        taskId: task.id,
        priority: newPriority,
      });
      onTaskUpdated?.({ id: task.id, priority: newPriority });
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  }

  async function handleColumnChange(newColId: string) {
    setColumnId(newColId);
    if (!task) return;

    try {
      await updateTaskAction({
        taskId: task.id,
        columnId: newColId,
      });
      onTaskUpdated?.({ id: task.id, columnId: newColId });
    } catch (err) {
      console.error("Failed to update status column:", err);
    }
  }

  async function handleAssigneeChange(val: string) {
    const nextAssigneeId = val === "unassigned" ? null : val;
    setAssigneeId(val);
    if (!task) return;

    try {
      await updateTaskAction({
        taskId: task.id,
        assigneeId: nextAssigneeId,
      });
      onTaskUpdated?.({ id: task.id, assigneeId: nextAssigneeId });
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  }

  async function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setDueDate(val);
    if (!task) return;

    const nextDate = val ? new Date(val) : null;
    try {
      await updateTaskAction({
        taskId: task.id,
        dueDate: nextDate,
      });
      onTaskUpdated?.({ id: task.id, dueDate: nextDate });
    } catch (err) {
      console.error("Failed to update due date:", err);
    }
  }

  async function handleDeleteTask() {
    if (!task) return;
    setIsDeleting(true);

    try {
      const res = await deleteTaskAction(task.id);
      if (res.success) {
        onTaskDeleted?.(task.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 overflow-hidden bg-[#121215] border-zinc-800 rounded-xl max-h-[88vh] flex flex-col shadow-2xl"
        data-testid="task-detail-modal"
      >
        <DialogHeader className="p-4 pb-2 border-b border-zinc-800/80">
          <DialogTitle className="sr-only">Task Details - {task.title}</DialogTitle>
          <div className="flex items-center justify-between gap-4">
            {/* Editable Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={!canManage}
              placeholder="Task Title"
              className="text-base font-semibold bg-transparent border-transparent hover:border-zinc-700/80 focus-visible:border-primary px-2 h-9 text-foreground"
              data-testid="task-detail-title-input"
            />
          </div>
        </DialogHeader>

        {/* 65% / 35% Split Layout Container */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800/80 overflow-y-auto">
          {/* Left Panel: 65% Width */}
          <div className="md:w-[65%] p-5 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Markdown Description */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">
                Description
              </span>

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "write" | "preview")}
                className="w-full"
              >
                <TabsList className="h-7 bg-zinc-900 border border-zinc-800 p-0.5">
                  <TabsTrigger
                    value="write"
                    onClick={() => setActiveTab("write")}
                    className="text-xs h-6 px-2.5"
                    data-testid="tab-trigger-write"
                  >
                    Write
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    onClick={() => setActiveTab("preview")}
                    className="text-xs h-6 px-2.5"
                    data-testid="tab-trigger-preview"
                  >
                    Preview
                  </TabsTrigger>
                </TabsList>

                {activeTab === "write" ? (
                  <div className="mt-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescriptionBlur}
                      disabled={!canManage}
                      placeholder="Add a more detailed description..."
                      className="min-h-[100px] text-xs bg-zinc-900 border-zinc-800 text-foreground resize-y focus-visible:ring-primary/40"
                      data-testid="task-description-textarea"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <div
                      className="min-h-[100px] rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed"
                      data-testid="task-description-preview"
                    >
                      {description || (
                        <span className="italic text-zinc-500">
                          No description provided.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Tabs>
            </div>

            {/* Subtasks Checklist */}
            <TaskSubtasks
              taskId={task.id}
              initialSubtasks={task.subtasks || []}
              canManage={canManage}
            />

            {/* Comments Stream */}
            <TaskComments
              taskId={task.id}
              initialComments={task.comments || []}
              currentUserId={currentUserId}
              canManage={canManage}
            />
          </div>

          {/* Right Panel: 35% Width */}
          <div className="md:w-[35%] p-5 space-y-5 bg-zinc-900/30 overflow-y-auto custom-scrollbar">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Task Details
            </h4>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-zinc-500" />
                <span>Status</span>
              </label>
              <Select
                value={columnId}
                onValueChange={handleColumnChange}
                disabled={!canManage}
              >
                <SelectTrigger
                  className="h-8 text-xs bg-zinc-900 border-zinc-700/80"
                  data-testid="task-status-select"
                >
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-foreground">
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id} className="text-xs">
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-zinc-500" />
                <span>Priority</span>
              </label>
              <Select
                value={priority}
                onValueChange={(val) =>
                  handlePriorityChange(val as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
                }
                disabled={!canManage}
              >
                <SelectTrigger
                  className="h-8 text-xs bg-zinc-900 border-zinc-700/80"
                  data-testid="task-priority-select"
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectItem value="URGENT" className="text-xs text-red-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="size-3 text-red-500" /> Urgent
                    </span>
                  </SelectItem>
                  <SelectItem value="HIGH" className="text-xs text-amber-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <ArrowUp className="size-3 text-amber-500" /> High
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM" className="text-xs text-blue-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Minus className="size-3 text-blue-500" /> Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="LOW" className="text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <ArrowDown className="size-3 text-slate-400" /> Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <UserIcon className="size-3.5 text-zinc-500" />
                <span>Assignee</span>
              </label>
              <Select
                value={assigneeId}
                onValueChange={handleAssigneeChange}
                disabled={!canManage}
              >
                <SelectTrigger
                  className="h-8 text-xs bg-zinc-900 border-zinc-700/80"
                  data-testid="task-assignee-select"
                >
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectItem value="unassigned" className="text-xs text-zinc-400">
                    Unassigned
                  </SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-xs">
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-zinc-500" />
                <span>Due Date</span>
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={handleDueDateChange}
                disabled={!canManage}
                className="h-8 text-xs bg-zinc-900 border-zinc-700/80 text-foreground"
                data-testid="task-due-date-input"
              />
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Tag className="size-3.5 text-zinc-500" />
                  <span>Labels</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map(({ label }) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      <span
                        className="size-1.5 rounded-full mr-1.5"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Task Button */}
            {canManage && (
              <div className="pt-4 border-t border-zinc-800/80">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 gap-2"
                  data-testid="delete-task-button"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  <span>Delete Task</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
