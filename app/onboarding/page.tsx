"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/lib/validations/workspace";
import { createWorkspaceAction, getUserWorkspacesAction } from "@/server/actions/workspaces";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Building, Plus, Compass } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [existingWorkspaces, setExistingWorkspaces] = React.useState<
    Array<{ id: string; name: string; slug: string; role: UserRole }>
  >([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = React.useState(true);

  React.useEffect(() => {
    async function loadWorkspaces() {
      try {
        const res = await getUserWorkspacesAction();
        if (res.success && res.data.length > 0) {
          setExistingWorkspaces(res.data);
        }
      } catch (err) {
        console.error("Failed to load existing workspaces", err);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    }
    loadWorkspaces();
  }, []);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const workspaceName = useWatch({
    control: form.control,
    name: "name",
  });

  // Auto-suggest slug when workspace name changes (if user hasn't explicitly modified slug)
  React.useEffect(() => {
    if (workspaceName && !form.getFieldState("slug").isDirty) {
      const generatedSlug = workspaceName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [workspaceName, form]);

  const onSubmit = (values: CreateWorkspaceInput) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await createWorkspaceAction({
          name: values.name,
          slug: values.slug || undefined,
        });

        if (!res.success) {
          setError(res.error || "Failed to create workspace");
          if (res.fieldErrors) {
            Object.entries(res.fieldErrors).forEach(([field, messages]) => {
              form.setError(field as keyof CreateWorkspaceInput, {
                message: messages[0],
              });
            });
          }
          return;
        }

        router.push(`/${res.data.workspaceId}`);
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-foreground px-4 py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
          <Compass className="size-6 text-white stroke-[2]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
          Setup your Workspace
        </h1>
        <p className="text-xs text-muted-foreground font-normal">
          Workspaces are isolated hubs where your team collaborates on projects and workflows.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Existing workspaces banner if user already has some */}
        {!isLoadingWorkspaces && existingWorkspaces.length > 0 && (
          <Card className="border-zinc-800/80 bg-[#121215]/80 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building className="size-4 text-primary" />
                Your Workspaces
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                You already belong to the following workspace(s):
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {existingWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  onClick={() => router.push(`/${ws.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-semibold text-foreground">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{ws.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/{ws.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ws.role}</Badge>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-primary">
                      Open <ArrowRight className="ml-1 size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Create workspace card */}
        <Card className="border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              Create New Workspace
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Give your workspace a recognizable name and custom URL slug.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Acme Engineering"
                          disabled={isPending}
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is the display name of your team or organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-muted-foreground">
                          <span className="text-zinc-500 select-none">meridian.app/</span>
                          <input
                            className="w-full bg-transparent py-2 pl-1 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none"
                            placeholder="acme-engineering"
                            disabled={isPending}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Custom URL identifier for your workspace.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-4 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      Create & Continue
                      <ArrowRight className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
