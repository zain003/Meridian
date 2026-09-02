"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  createColumnSchema,
  type CreateColumnInput,
} from "@/lib/validations/project";
import { createColumnAction } from "@/server/actions/boards";

interface AddColumnButtonProps {
  boardId: string;
  canManage?: boolean;
  onColumnCreated?: (column: { id: string; name: string; order: number }) => void;
}

export function AddColumnButton({
  boardId,
  canManage = true,
  onColumnCreated,
}: AddColumnButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CreateColumnInput>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: {
      boardId,
      name: "",
    },
  });

  const { isSubmitting } = form.formState;

  if (!canManage) {
    return null;
  }

  const onSubmit = async (values: CreateColumnInput) => {
    setServerError(null);

    try {
      const res = await createColumnAction({
        boardId,
        name: values.name.trim(),
      });

      if (!res.success) {
        if (res.fieldErrors?.name) {
          form.setError("name", {
            type: "manual",
            message: res.fieldErrors.name[0],
          });
          return;
        }
        setServerError(res.error || "Failed to add column");
        return;
      }

      const createdId = res.data?.columnId || "col-created";
      if (onColumnCreated) {
        onColumnCreated({
          id: createdId,
          name: values.name.trim(),
          order: 999,
        });
      }

      form.reset({ boardId, name: "" });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to create column:", err);
      setServerError("An unexpected error occurred.");
    }
  };

  const handleCancel = () => {
    form.reset({ boardId, name: "" });
    setServerError(null);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-80 shrink-0 h-11 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800/80 bg-[#121215]/40 px-4 text-xs font-medium text-muted-foreground hover:border-zinc-700 hover:bg-[#121215]/80 hover:text-foreground transition-all duration-150 active:scale-[0.99]"
      >
        <Plus className="size-4" />
        <span>Add Column</span>
      </button>
    );
  }

  return (
    <div className="w-80 shrink-0 rounded-xl border border-zinc-800 bg-[#121215] p-3 shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {serverError && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-400">
              {serverError}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter column name..."
                    {...field}
                    autoFocus
                    disabled={isSubmitting}
                    className="h-8 text-xs bg-zinc-900/80 border-zinc-700/80 rounded-lg placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-7 px-2.5 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                <span>Add Column</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="size-6 text-zinc-500 hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
