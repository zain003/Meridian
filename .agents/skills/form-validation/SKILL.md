---
name: form-validation
description: >-
  Provides patterns and best practices for building type-safe forms using React Hook Form,
  Zod schema validation, and shadcn/ui Form primitives in Next.js 16.
  Use when implementing user input forms, dialog inputs, inline creation fields, or Server Action payload validation.
---

# Form Validation with React Hook Form & Zod

## Overview

All forms across Meridian use **React Hook Form** with `@hookform/resolvers/zod` for client-side state and instant feedback, paired with **Zod** schema re-validation in Server Actions.

## Standard Form Pattern

### 1. Define the Zod Schema (`lib/validations/*.ts` or `types/*.ts`)

```typescript
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  columnId: z.string().min(1, "Column is required"),
  dueDate: z.date().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

### 2. Client Component Form Implementation

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/task";
import { createTaskAction } from "@/server/actions/tasks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function CreateTaskForm({ workspaceId, columnId, onSuccess }: { workspaceId: string; columnId: string; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      columnId,
    },
  });

  function onSubmit(values: CreateTaskInput) {
    startTransition(async () => {
      const res = await createTaskAction({ ...values, workspaceId });
      if (res.success) {
        form.reset();
        onSuccess?.();
      } else {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([key, errors]) => {
            form.setError(key as keyof CreateTaskInput, { message: errors[0] });
          });
        } else {
          form.setError("root", { message: res.error || "Failed to create task" });
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Task"}
        </Button>
      </form>
    </Form>
  );
}
```

### 3. Server Action Re-Validation

```typescript
"use server";

import { createTaskSchema } from "@/lib/validations/task";
import type { ActionResponse } from "@/types";

export async function createTaskAction(rawInput: unknown): Promise<ActionResponse<{ id: string }>> {
  const parsed = createTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Execute database mutation...
  return { success: true, data: { id: "..." } };
}
```

## Best Practices

1. **Never skip server-side validation**: Always execute `schema.safeParse()` inside the Server Action.
2. **Accessible Error Messages**: Always include `<FormMessage />` in every `<FormItem>`.
3. **Prevent Double Submission**: Disable submit buttons and display a spinning loader (`Loader2`) when `isPending` or `formState.isSubmitting` is true.
