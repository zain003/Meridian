"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";
import { createTaskAction } from "@/server/actions/tasks";

const quickTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title cannot be empty")
    .max(200, "Task title must be 200 characters or less"),
});

type QuickTaskInput = z.infer<typeof quickTaskSchema>;

export interface QuickAddTaskProps {
  workspaceId: string;
  projectId: string;
  columnId: string;
  onTaskCreated?: (task: {
    id: string;
    columnId: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    order: number;
  }) => void;
}

export function QuickAddTask({
  workspaceId,
  projectId,
  columnId,
  onTaskCreated,
}: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<QuickTaskInput>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      setFocus("title");
    }
  }, [isOpen, setFocus]);

  async function onSubmit(data: QuickTaskInput) {
    try {
      const res = await createTaskAction({
        workspaceId,
        projectId,
        columnId,
        title: data.title.trim(),
      });

      if (res.success) {
        onTaskCreated?.({
          id: res.data.taskId,
          columnId,
          title: data.title.trim(),
          priority: "MEDIUM",
          order: 9999, // Placed at bottom
        });
        reset({ title: "" });
        setFocus("title");
      } else {
        setError("title", {
          message: res.error || "Failed to create task",
        });
      }
    } catch {
      setError("title", {
        message: "An unexpected error occurred",
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      reset({ title: "" });
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800/80 rounded-lg h-8 px-2 transition-colors"
        data-testid={`quick-add-btn-${columnId}`}
      >
        <Plus className="size-3.5" />
        <span>Add task</span>
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-2 pt-1"
      data-testid={`quick-add-form-${columnId}`}
    >
      <div className="space-y-1">
        <Input
          {...register("title")}
          placeholder="What needs to be done?"
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          className="h-8 text-xs bg-zinc-900 border-zinc-700/80 text-foreground placeholder:text-zinc-500 focus-visible:ring-primary/40 focus-visible:border-primary"
          data-testid="quick-add-input"
        />
        {errors.title && (
          <p className="text-[11px] text-red-400 font-medium px-1">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="h-7 text-xs px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium"
          data-testid="quick-add-submit"
        >
          {isSubmitting ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : (
            <Plus className="size-3 mr-1" />
          )}
          <span>Add</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            reset({ title: "" });
          }}
          disabled={isSubmitting}
          className="h-7 text-xs px-2 text-zinc-400 hover:text-foreground hover:bg-zinc-800/80 rounded-md"
        >
          <X className="size-3.5" />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
    </form>
  );
}
