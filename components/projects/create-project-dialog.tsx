"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { createProjectAction } from "@/server/actions/projects";

interface CreateProjectDialogProps {
  workspaceId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function generateProjectKey(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    // e.g. "Mobile App" -> "MA", or first letters + next char up to 3-4 chars
    const acronym = words.map((w) => w[0]).join("").toUpperCase();
    if (acronym.length >= 2 && acronym.length <= 4) return acronym;
    return acronym.slice(0, 4);
  }

  // Single word: e.g. "Meridian" -> "MER"
  return cleaned.slice(0, 3).toUpperCase();
}

export function CreateProjectDialog({
  workspaceId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = React.useState(false);
  const router = useRouter();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      workspaceId,
      name: "",
      key: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName, { shouldValidate: true });

    if (!isKeyManuallyEdited) {
      const generatedKey = generateProjectKey(newName);
      form.setValue("key", generatedKey, { shouldValidate: generatedKey.length >= 2 });
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsKeyManuallyEdited(true);
    form.setValue("key", e.target.value.toUpperCase(), { shouldValidate: true });
  };

  const onSubmit = async (values: CreateProjectInput) => {
    setServerError(null);

    try {
      const res = await createProjectAction({
        ...values,
        workspaceId,
      });

      if (!res.success) {
        if (res.error === "KEY_ALREADY_EXISTS") {
          form.setError("key", {
            type: "manual",
            message: "A project with this key already exists in this workspace",
          });
          return;
        }

        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            form.setError(field as keyof CreateProjectInput, {
              type: "manual",
              message: messages[0],
            });
          }
          return;
        }

        setServerError(res.error || "Failed to create project");
        return;
      }

      form.reset({
        workspaceId,
        name: "",
        key: "",
        description: "",
      });
      setIsKeyManuallyEdited(false);
      setOpen(false);

      if (res.data?.projectId) {
        router.push(`/${workspaceId}/projects/${res.data.projectId}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset({
            workspaceId,
            name: "",
            key: "",
            description: "",
          });
          setIsKeyManuallyEdited(false);
          setServerError(null);
        }
      }}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Create Project</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FolderPlus className="size-5" />
            <DialogTitle>Create New Project</DialogTitle>
          </div>
          <DialogDescription>
            Organize tasks, milestones, and automated workflows into dedicated project boards.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {serverError && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mobile Application, Core Platform"
                      {...field}
                      onChange={handleNameChange}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. MOB, MER"
                      {...field}
                      onChange={handleKeyChange}
                      maxLength={10}
                      disabled={isSubmitting}
                      className="font-mono uppercase tracking-wider"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-zinc-500">
                    Prefix used for all task identifiers (e.g. {field.value || "KEY"}-101).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief overview of the project scope"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>Create Project</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
