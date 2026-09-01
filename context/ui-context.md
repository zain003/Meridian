# UI Context

> **Design Specification Reference**: For exhaustive styling guidelines, morphism recipes, and component tokens, refer to [`context/UI/UI-Rules.md`](file:///c:/Users/zaina/Desktop/Meridian/context/UI/UI-Rules.md).

## Theme & Aesthetic

Meridian features a sleek, high-density modern technical workspace aesthetic inspired by tools like Linear and Asana. It provides a cohesive dark mode (primary default) and a clean light mode, built on **Next.js 16**, **shadcn/ui**, **Tailwind CSS**, and **Lucide Icons**.

- **Dark Theme (Default)**: Deep obsidian/zinc backgrounds (`#09090b`), layered neutral surfaces (`#121215`, `#18181b`), subtle hairline borders (`#27272a`), and vibrant indigo/emerald/amber accents for active and interactive states.
- **Light Theme**: Crisp clean white and zinc neutral backgrounds (`#ffffff`, `#f4f4f5`), soft borders (`#e4e4e7`), and deep text contrast.
- **Visual Polish**: Smooth transitions, backdrop blurs on dialogs and navigation bars, subtle hover elevations, and responsive micro-animations.

## Colors & CSS Variables

All components must use CSS custom property tokens or mapped Tailwind CSS utility classes. No hardcoded hex values in component code.

| Role | CSS Variable | Dark Value | Light Value | Tailwind Class / Token | Description |
| --- | --- | --- | --- | --- | --- |
| **Page background** | `--background` / `--bg-base` | `#09090b` | `#ffffff` | `bg-background` | Main application canvas background |
| **Foreground / Text** | `--foreground` | `#f4f4f5` | `#09090b` | `text-foreground` | High-contrast primary text and headings |
| **Surface (Default)** | `--card` / `--bg-surface` | `#121215` | `#ffffff` | `bg-card` | Cards, panels, sidebar backgrounds |
| **Surface (Raised)** | `--popover` / `--bg-surface-raised` | `#18181b` | `#f4f4f5` | `bg-popover` | Hover states, modals, popovers, dropdowns |
| **Primary text** | `--text-primary` | `#f4f4f5` | `#09090b` | `text-foreground` | Main task titles, high-contrast copy |
| **Secondary text** | `--muted-foreground` | `#a1a1aa` | `#52525b` | `text-muted-foreground` | Subtitles, metadata labels, column headers |
| **Primary accent** | `--primary` | `#6366f1` | `#4f46e5` | `bg-primary text-primary-foreground` | Primary buttons, active tabs, focus rings |
| **Accent hover** | `--primary-hover` | `#4f46e5` | `#4338ca` | `hover:bg-primary/90` | Primary button hover states |
| **Default border** | `--border` | `#27272a` | `#e4e4e7` | `border-border` | Standard component and panel borders |
| **Input border** | `--input` | `#27272a` | `#e4e4e7` | `border-input` | Form input and control borders |
| **Focus ring** | `--ring` | `#6366f1` | `#4f46e5` | `ring-ring` | Keyboard focus ring outlines |
| **Destructive / Urgent** | `--destructive` | `#ef4444` | `#dc2626` | `bg-destructive text-destructive-foreground` | Urgent priority, error alerts, delete actions |
| **Warning / High** | `--state-warning` | `#f59e0b` | `#d97706` | `text-amber-500 bg-amber-500/10` | High priority, warning badges, due-soon alerts |
| **Success / Done** | `--state-success` | `#10b981` | `#059669` | `text-emerald-500 bg-emerald-500/10` | Completed tasks, success notifications |
| **Info / In Progress**| `--state-info` | `#3b82f6` | `#2563eb` | `text-blue-500 bg-blue-500/10` | In-progress status, information callouts |

### Task Priority Palette

- **Urgent**: `bg-red-500/10 text-red-500 border-red-500/20`
- **High**: `bg-amber-500/10 text-amber-500 border-amber-500/20`
- **Medium**: `bg-blue-500/10 text-blue-500 border-blue-500/20`
- **Low**: `bg-slate-500/10 text-slate-400 border-slate-500/20`

## Typography

| Role | Font Family | Variable | Usage |
| --- | --- | --- | --- |
| **UI text** | Inter / Geist Sans | `--font-sans` | Body text, buttons, task titles, navigation, labels |
| **Code / Mono** | JetBrains Mono / Geist Mono | `--font-mono` | Automation rules, logs, IDs, timestamps, expressions |

### Hierarchy
- **Page Titles**: `text-2xl font-semibold tracking-tight`
- **Section Headers / Board Column Titles**: `text-sm font-medium uppercase tracking-wider text-muted-foreground`
- **Task Titles**: `text-sm font-medium text-foreground`
- **Metadata / Badges / Subtext**: `text-xs font-normal text-muted-foreground`

## Border Radius Tokens

| Context | Tailwind Class | Radius Token |
| --- | --- | --- |
| **Inline Badges / Tags / Small Inputs** | `rounded-md` | `var(--radius - 2px)` (6px) |
| **Cards / Task Items / Dropdown Menus** | `rounded-lg` | `var(--radius)` (8px) |
| **Modals / Dialogs / Rule Nodes** | `rounded-xl` | `calc(var(--radius) + 4px)` (12px) |
| **Avatars / Status Indicators / Pills** | `rounded-full` | `9999px` |

## Component Library (shadcn/ui)

- UI primitives reside in `components/ui/` built on **Radix UI** primitives and **Tailwind CSS**.
- Required primitives:
  - `Button`, `Input`, `Textarea`, `Label`, `Checkbox`, `Select`, `DropdownMenu`
  - `Dialog`, `Sheet`, `Popover`, `Tooltip`, `Avatar`, `Badge`, `Card`, `Tabs`
  - `Command` (for `Cmd+K` palette), `Separator`, `Skeleton`, `Toast` / `Sonner`
- All components must leverage shadcn standard props (e.g. `variant`, `size`, `asChild`).

## Form Patterns (React Hook Form + Zod)

- All forms use **React Hook Form** paired with **Zod** (`zodResolver`) and shadcn form wrappers:
  ```tsx
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter title..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
      </Button>
    </form>
  </Form>
  ```

## Iconography (Lucide React)

- **Standard Library**: `lucide-react`.
- **Stroke Width**: `1.5` to `2.0` for a clean, crisp outline appearance.
- **Sizes**:
  - `h-3.5 w-3.5` or `h-4 w-4` for inline badges, dropdown menu items, and task card metadata.
  - `h-4 w-4` or `h-5 w-5` for button icons, navbar actions, and sidebar navigation links.
  - `h-6 w-6` for empty state illustrations and modal headers.

## Layout Patterns

- **Workspace Shell**:
  - **Left Sidebar**: 240px fixed width, collapsible. Contains workspace switcher (`DropdownMenu`), navigation links (Inbox, My Tasks, Projects, Automation, Analytics, Settings), and project lists.
  - **Top Navbar**: Fixed height (56px) with breadcrumb path, live presence collaborator avatars (`AvatarStack`), global search trigger (`Cmd+K`), notification bell with unread badge (`Popover`), and user profile avatar.
  - **Main Content**: Dynamic viewport area with sticky headers for view controls (Kanban / List / Calendar tabs, filter bar, group by, sort, and "New Task" CTA).
- **Kanban Board**:
  - Horizontally scrollable column container.
  - Fixed column width (`w-80` / 320px) with column header (name, count badge, sort menu, add button).
  - Drag-and-drop task cards with smooth hover elevation, drop indicator placeholder, and drag overlay shadow.
- **Automation Rule Builder**:
  - Block-based visual canvas displaying:
    `[Trigger Node]` ➔ `[Condition Filter Block]` ➔ `[Action Dispatch Node]`.
  - Step connectors with animation and execution status pills (Active / Disabled / Tested).
- **Task Detail Modal / Slide-over**:
  - Responsive `Dialog` or `Sheet` drawer.
  - Left panel (65%): Task title input, rich text markdown description, subtask checklist with progress bar, comment thread with @mentions and file attachments.
  - Right panel (35%): Status dropdown, priority selector, assignee combobox, due date calendar picker, label tags, and automation execution log history.
- **Analytics Dashboard**:
  - Top summary cards: Velocity rate, Open vs Completed ratio, Avg Cycle Time, Overdue Count.
  - Chart grid: Recharts/Tremor powered burndown area chart, cycle time histogram, and team workload distribution bar chart.
