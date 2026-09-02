"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { addCommentAction, deleteCommentAction } from "@/server/actions/comments";

const addCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be 5000 characters or less"),
});

type AddCommentInput = z.infer<typeof addCommentSchema>;

export interface CommentItem {
  id: string;
  content: string;
  createdAt: Date | string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface TaskCommentsProps {
  taskId: string;
  initialComments: CommentItem[];
  currentUserId?: string;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  canManage?: boolean;
}

export function TaskComments({
  taskId,
  initialComments,
  currentUserId,
  currentUser,
  canManage = true,
}: TaskCommentsProps) {
  const [comments, setComments] = React.useState<CommentItem[]>(initialComments);
  const [prevInitialComments, setPrevInitialComments] = React.useState<CommentItem[]>(initialComments);

  if (initialComments !== prevInitialComments) {
    setPrevInitialComments(initialComments);
    setComments(initialComments);
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddCommentInput>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(data: AddCommentInput) {
    try {
      const res = await addCommentAction(taskId, data.content.trim());
      if (res.success) {
        const newComment: CommentItem = {
          id: res.data.commentId,
          content: data.content.trim(),
          createdAt: new Date(),
          user: currentUser || {
            id: currentUserId || "current-user",
            name: "You",
            email: "user@example.com",
            image: null,
          },
        };
        setComments((prev) => [...prev, newComment]);
        reset({ content: "" });
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }

  async function handleDelete(commentId: string) {
    const previous = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const res = await deleteCommentAction(commentId);
      if (!res.success) {
        setComments(previous);
      }
    } catch {
      setComments(previous);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  }

  return (
    <div className="space-y-4" data-testid="task-comments-section">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <MessageSquare className="size-4 text-primary" />
        <span>Activity & Comments</span>
        {comments.length > 0 && (
          <span className="text-[11px] font-normal text-muted-foreground ml-1">
            ({comments.length})
          </span>
        )}
      </div>

      {/* Comment Stream */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {comments.map((comment) => {
          const initials = comment.user?.name
            ? comment.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : comment.user?.email
            ? comment.user.email.slice(0, 2).toUpperCase()
            : "U";

          const isAuthor = currentUserId ? comment.user.id === currentUserId : true;
          const formattedDate = new Date(comment.createdAt).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          return (
            <div
              key={comment.id}
              data-testid={`comment-item-${comment.id}`}
              className="group flex items-start gap-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5 text-xs text-foreground"
            >
              <Avatar className="size-6 border border-zinc-700 shrink-0 mt-0.5">
                {comment.user?.image && (
                  <AvatarImage src={comment.user.image} alt={comment.user.name || "User"} />
                )}
                <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-300 font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {comment.user?.name || comment.user?.email || "Team Member"}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formattedDate}
                    </span>
                  </div>

                  {(isAuthor || canManage) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(comment.id)}
                      className="size-5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`comment-delete-${comment.id}`}
                    >
                      <Trash2 className="size-3" />
                      <span className="sr-only">Delete comment</span>
                    </Button>
                  )}
                </div>

                <p className="text-xs text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-xs text-zinc-500 italic py-2 text-center">
            No comments yet. Start the conversation below.
          </p>
        )}
      </div>

      {/* New Comment Input */}
      {canManage && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-2 pt-1 border-t border-zinc-800/60"
          data-testid="add-comment-form"
        >
          <div className="space-y-1">
            <Textarea
              {...register("content")}
              placeholder="Write a comment... (Cmd+Enter to send)"
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className="min-h-[64px] text-xs bg-zinc-900 border-zinc-700/80 text-foreground resize-none focus-visible:ring-primary/40"
              data-testid="comment-textarea"
            />
            {errors.content && (
              <p className="text-[11px] text-red-400 font-medium">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              Press <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">⌘+Enter</kbd> to post
            </span>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-7 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium"
              data-testid="comment-submit-btn"
            >
              {isSubmitting ? (
                <Loader2 className="size-3 animate-spin mr-1" />
              ) : (
                <Send className="size-3 mr-1" />
              )}
              <span>Comment</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
