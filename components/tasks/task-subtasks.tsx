"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckSquare, Loader2 } from "lucide-react";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/server/actions/subtasks";
import { cn } from "@/lib/utils";

const addSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Subtask title cannot be empty")
    .max(200, "Subtask title must be 200 characters or less"),
});

type AddSubtaskInput = z.infer<typeof addSubtaskSchema>;

export interface SubtaskItem {
  id: string;
  title?: string;
  isDone: boolean;
  order?: number;
}

export interface TaskSubtasksProps {
  taskId: string;
  initialSubtasks: SubtaskItem[];
  canManage?: boolean;
  onSubtasksChange?: (subtasks: SubtaskItem[]) => void;
}

export function TaskSubtasks({
  taskId,
  initialSubtasks,
  canManage = true,
  onSubtasksChange,
}: TaskSubtasksProps) {
  const [subtasks, setSubtasks] = React.useState<SubtaskItem[]>(initialSubtasks);
  const [prevInitialSubtasks, setPrevInitialSubtasks] = React.useState<SubtaskItem[]>(initialSubtasks);
  const [isAdding, setIsAdding] = React.useState(false);

  if (initialSubtasks !== prevInitialSubtasks) {
    setPrevInitialSubtasks(initialSubtasks);
    setSubtasks(initialSubtasks);
  }

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AddSubtaskInput>({
    resolver: zodResolver(addSubtaskSchema),
    defaultValues: {
      title: "",
    },
  });

  React.useEffect(() => {
    if (isAdding) {
      setFocus("title");
    }
  }, [isAdding, setFocus]);

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.isDone).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleToggle(subtaskId: string, isDone: boolean) {
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isDone } : s
    );
    setSubtasks(updated);
    onSubtasksChange?.(updated);

    try {
      const res = await toggleSubtaskAction(subtaskId, isDone);
      if (!res.success) {
        // Rollback
        setSubtasks(subtasks);
        onSubtasksChange?.(subtasks);
      }
    } catch {
      setSubtasks(subtasks);
      onSubtasksChange?.(subtasks);
    }
  }

  async function handleDelete(subtaskId: string) {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(updated);
    onSubtasksChange?.(updated);

    try {
      const res = await deleteSubtaskAction(subtaskId);
      if (!res.success) {
        setSubtasks(subtasks);
        onSubtasksChange?.(subtasks);
      }
    } catch {
      setSubtasks(subtasks);
      onSubtasksChange?.(subtasks);
    }
  }

  async function onSubmit(data: AddSubtaskInput) {
    try {
      const res = await createSubtaskAction({
        taskId,
        title: data.title.trim(),
      });

      if (res.success) {
        const newSubtask: SubtaskItem = {
          id: res.data.subtaskId,
          title: data.title.trim(),
          isDone: false,
          order: subtasks.length,
        };
        const updated = [...subtasks, newSubtask];
        setSubtasks(updated);
        onSubtasksChange?.(updated);
        reset({ title: "" });
        setFocus("title");
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  }

  return (
    <div className="space-y-3" data-testid="task-subtasks-section">
      {/* Header with count and progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CheckSquare className="size-4 text-primary" />
          <span>Subtasks</span>
          {total > 0 && (
            <span className="text-[11px] font-normal text-muted-foreground ml-1">
              ({completed}/{total})
            </span>
          )}
        </div>

        {total > 0 && (
          <span
            className="text-[11px] font-medium text-muted-foreground"
            data-testid="subtask-progress-percentage"
          >
            {percentage}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <Progress
          value={percentage}
          className="h-1.5 bg-zinc-800"
          data-testid="subtask-progress-bar"
        />
      )}

      {/* Checklist */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            data-testid={`subtask-item-${subtask.id}`}
            className="group flex items-center justify-between gap-2 rounded-md p-1.5 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Checkbox
                checked={subtask.isDone}
                onCheckedChange={(checked) =>
                  handleToggle(subtask.id, Boolean(checked))
                }
                disabled={!canManage}
                data-testid={`subtask-checkbox-${subtask.id}`}
              />
              <span
                className={cn(
                  "text-xs leading-none transition-all truncate",
                  subtask.isDone
                    ? "line-through text-zinc-500"
                    : "text-foreground font-normal"
                )}
              >
                {subtask.title}
              </span>
            </div>

            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(subtask.id)}
                className="size-6 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`subtask-delete-${subtask.id}`}
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Delete subtask</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Subtask Trigger / Form */}
      {canManage && (
        <>
          {isAdding ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex items-center gap-1.5 pt-1"
              data-testid="add-subtask-form"
            >
              <Input
                {...register("title")}
                placeholder="Add a step..."
                disabled={isSubmitting}
                className="h-7 text-xs bg-zinc-900 border-zinc-700/80 text-foreground"
                data-testid="add-subtask-input"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-7 text-xs px-2.5 bg-primary text-primary-foreground"
                data-testid="add-subtask-submit"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Plus className="size-3" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  reset({ title: "" });
                }}
                className="h-7 text-xs px-2 text-zinc-400 hover:text-foreground"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800/80 rounded-md h-7 px-2"
              data-testid="add-subtask-btn"
            >
              <Plus className="size-3.5" />
              <span>Add subtask</span>
            </Button>
          )}

          {errors.title && (
            <p className="text-[11px] text-red-400 font-medium">
              {errors.title.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
