"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteColumnAction } from "@/server/actions/boards";

interface BoardColumnHeaderProps {
  columnId: string;
  columnName: string;
  taskCount?: number;
  canManage?: boolean;
  onAddTask?: () => void;
  onColumnDeleted?: (columnId: string) => void;
}

export function BoardColumnHeader({
  columnId,
  columnName,
  taskCount = 0,
  canManage = true,
  onAddTask,
  onColumnDeleted,
}: BoardColumnHeaderProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteColumnAction(columnId);

      if (!res.success) {
        if (res.error === "CANNOT_DELETE_LAST_COLUMN") {
          setDeleteError("Cannot delete the only remaining column on a board.");
        } else {
          setDeleteError(res.error || "Failed to delete column.");
        }
        setIsDeleting(false);
        return;
      }

      setIsConfirmOpen(false);
      setIsDeleting(false);
      if (onColumnDeleted) {
        onColumnDeleted(columnId);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to delete column:", err);
      setDeleteError("An unexpected error occurred while deleting the column.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1 py-1.5 select-none">
        {/* Title & Count */}
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {columnName}
          </h3>
          <Badge
            variant="secondary"
            className="h-4 min-w-4 px-1 text-[10px] font-mono font-medium rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 flex items-center justify-center"
          >
            {taskCount}
          </Badge>
        </div>

        {/* Actions Controls */}
        {canManage && (
          <div className="flex items-center gap-0.5">
            <Button
              onClick={onAddTask}
              variant="ghost"
              size="icon"
              className="size-6 text-zinc-400 hover:text-foreground hover:bg-zinc-800/80 rounded"
              title={`Add task to ${columnName}`}
            >
              <Plus className="size-3.5" />
              <span className="sr-only">Add Task</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-zinc-400 hover:text-foreground hover:bg-zinc-800/80 rounded"
                  title="Column options"
                >
                  <MoreHorizontal className="size-3.5" />
                  <span className="sr-only">Column Options</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44 bg-[#18181b] border-zinc-800">
                <DropdownMenuItem
                  onClick={onAddTask}
                  className="gap-2 text-xs text-foreground cursor-pointer focus:bg-zinc-800"
                >
                  <Plus className="size-3.5 text-zinc-400" />
                  <span>Add Task</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-800" />

                <DropdownMenuItem
                  onClick={() => setIsConfirmOpen(true)}
                  className="gap-2 text-xs text-rose-400 cursor-pointer focus:bg-rose-500/10 focus:text-rose-400"
                >
                  <Trash2 className="size-3.5 text-rose-400" />
                  <span>Delete Column</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="size-5" />
              <DialogTitle>Delete Column</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete the column <strong>&quot;{columnName}&quot;</strong>?
              {taskCount > 0 && (
                <span className="block mt-1.5 text-amber-400">
                  This column contains {taskCount} task{taskCount > 1 ? "s" : ""}. Tasks will be moved to the Backlog column automatically.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
              {deleteError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Delete Column</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
