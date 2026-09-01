---
name: shadcn-ui
description: >-
  Provides guidelines and workflows for installing, configuring, and composing shadcn/ui
  primitives and Radix UI components with Tailwind CSS in Next.js 16 projects.
  Use when adding new UI primitives, building accessible dialogs, sheets, menus, or forms,
  or configuring component styling.
---

# shadcn/ui Component Skill

## Overview

This skill guides the installation, styling, and composition of **shadcn/ui** components built on **Radix UI** primitives and **Tailwind CSS**.

## Directory Conventions

- Base primitives reside in: `@/components/ui/` (e.g. `button.tsx`, `dialog.tsx`, `input.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `avatar.tsx`).
- Utility functions reside in: `@/lib/utils.ts` (specifically the `cn()` class merging utility).
- Domain/Feature components import from `@/components/ui/*` and compose them into higher-level features.

## Adding Components

To add or update shadcn primitives, use `npx shadcn@latest add <component>`:
```bash
npx shadcn@latest add button dialog dropdown-menu popover select tabs avatar badge card sheet tooltip form input textarea checkbox
```

## Styling & Token Rules

1. **No Hardcoded Hex Values**: All components must reference Tailwind theme utilities linked to CSS custom properties (e.g. `bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-primary`).
2. **Use `cn()` for Class Merging**: Always use `cn(...)` from `@/lib/utils` when applying conditional classes or allowing `className` prop overrides:
   ```tsx
   import { cn } from "@/lib/utils";

   export function StatusBadge({ status, className }: { status: string; className?: string }) {
     return (
       <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", className)}>
         {status}
       </span>
     );
   }
   ```
3. **Accessibility**: Retain Radix UI accessibility attributes (`aria-expanded`, keyboard triggers, focus rings).

## Verification Checklist

- [ ] Primitive is located under `components/ui/`.
- [ ] Exported components support `className` and standard HTML/Radix props via `React.forwardRef` or modern React 19 props.
- [ ] Renders properly in both Dark mode (default) and Light mode.
