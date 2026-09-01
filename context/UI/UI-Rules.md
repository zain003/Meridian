# Meridian UI & Design System Rules

> **Single Source of Truth for Visual Design, Styling Tokens, Morphism, and Component Aesthetics.**
> Every frontend feature and UI component must strictly adhere to the tokens, patterns, and rules documented in this file.

---

## 1. Design Philosophy: "Quiet Luxury" SaaS

Meridian delivers a state-of-the-art, hyper-polished, modern technical SaaS experience (inspired by Linear, Raycast, and Vercel). The interface is engineered to feel:
- **Effortless & Joyful**: Micro-animations, responsive hover feedback, and instantaneous optimistic state changes.
- **Crystal Clear & High-Density**: Clean information hierarchy with zero visual clutter or superfluous decorations.
- **Premium Glassmorphism**: Layered dark obsidian surfaces, subtle hairline borders with specular reflections, and soft ambient glows.
- **Consistent & Predictable**: 100% standardized typography, border radius, spacing tokens, and color semantics.

---

## 2. Theme & Color Palette

All styling is built on **Tailwind CSS** mapped to CSS custom properties. **Never use raw/arbitrary hex values in component code.**

### 2.1 Dark Mode (Primary Default) & Light Mode Tokens

| Role | CSS Token | Dark Mode Value | Light Mode Value | Tailwind Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `--background` | `#09090b` (Deep Obsidian) | `#ffffff` (Pure White) | `bg-background` | Main application backdrop |
| **Base Surface** | `--card` | `#121215` (Layer 1 Neutral) | `#f4f4f5` (Zinc Light) | `bg-card` | Sidebar, Kanban columns, table bodies |
| **Raised Surface** | `--popover` | `#18181b` (Layer 2 Surface) | `#ffffff` (Pure White) | `bg-popover` | Cards, task items, dropdown menus |
| **Overlay / Dialog** | `--modal` | `#1c1c20` (Layer 3 Glass) | `#ffffff` (Pure White) | `bg-surface-overlay` | Dialogs, slide-overs, command palettes |
| **Primary Text** | `--foreground` | `#f4f4f5` (Zinc 100) | `#09090b` (Zinc 950) | `text-foreground` | High-contrast headings and task titles |
| **Secondary Text** | `--muted-foreground` | `#a1a1aa` (Zinc 400) | `#52525b` (Zinc 600) | `text-muted-foreground` | Subtitles, column headers, metadata |
| **Muted / Disabled** | `--text-muted` | `#71717a` (Zinc 500) | `#a1a1aa` (Zinc 400) | `text-zinc-500` | Timestamps, empty state labels |
| **Primary Brand** | `--primary` | `#6366f1` (Electric Indigo) | `#4f46e5` (Deep Indigo) | `bg-primary text-primary-foreground` | Primary buttons, active tabs, highlights |
| **Brand Glow / Hover** | `--primary-hover` | `#4f46e5` (Vibrant Violet) | `#4338ca` (Indigo 700) | `hover:bg-primary/90` | Hover state on primary actions |
| **Default Border** | `--border` | `#27272a` (Zinc 800) | `#e4e4e7` (Zinc 200) | `border-border` | Component cards, column dividers |
| **Subtle Border** | `--border-subtle` | `#1f1f23` (Zinc 850) | `#f4f4f5` (Zinc 100) | `border-zinc-800/50` | Dividers, row borders, subtasks |
| **Input Border** | `--input` | `#27272a` (Zinc 800) | `#e4e4e7` (Zinc 200) | `border-input` | Form inputs, select dropdowns |
| **Focus Ring** | `--ring` | `#6366f1` (Indigo 500) | `#4f46e5` (Indigo 600) | `ring-ring` | Keyboard focus accessibility rings |

---

### 2.2 Semantic State Tokens

| State | CSS Variable | Color Code | Background / Badge Class | Text / Icon Class | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Urgent / Error** | `--destructive` | `#ef4444` | `bg-rose-500/10 border-rose-500/20` | `text-rose-400` | Urgent tasks, delete actions, errors |
| **High / Warning** | `--warning` | `#f59e0b` | `bg-amber-500/10 border-amber-500/20` | `text-amber-400` | High priority, due soon, warnings |
| **Done / Success** | `--success` | `#10b981` | `bg-emerald-500/10 border-emerald-500/20` | `text-emerald-400` | Done column, complete tasks, success |
| **In Progress / Info**| `--info` | `#3b82f6` | `bg-sky-500/10 border-sky-500/20` | `text-sky-400` | In Progress column, info callouts |
| **Low / Backlog** | `--neutral` | `#64748b` | `bg-slate-500/10 border-slate-500/20` | `text-slate-400` | Low priority, backlog status, tags |

---

## 3. Morphism, Glass & Lighting Effects

Meridian utilizes subtle, refined glassmorphism to create depth without sacrificing legibility:

### 3.1 Glass Recipes

- **Sticky Topbar & Floating Navigation**:
  ```css
  backdrop-blur-md bg-[#09090b]/80 border-b border-zinc-800/60
  ```
- **Modal & Slide-over Backdrops**:
  ```css
  backdrop-blur-sm bg-black/60
  ```
- **Card Specular Hairline (Subtle 3D Edge)**:
  ```css
  border border-zinc-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
  ```
- **Hover Glow Elevation**:
  ```css
  hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/40 transition-all duration-150 ease-out
  ```

---

## 4. Typography Hierarchy

- **UI & Body Font**: `Geist Sans`, `Inter`, or system sans-serif (`--font-sans`).
- **Code, Data & Automation Rules**: `Geist Mono`, `JetBrains Mono` (`--font-mono`).

| Element | Class Name | Weight | Letter Spacing | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-2xl font-semibold` | `600` | `tracking-tight` | Dashboard page headers, onboarding titles |
| **Section / Modal Title** | `text-lg font-semibold` | `600` | `tracking-tight` | Dialog headers, sidebar workspace name |
| **Column Header** | `text-xs font-semibold uppercase`| `600` | `tracking-wider` | Kanban column titles, table headers |
| **Card / Task Title** | `text-sm font-medium` | `500` | `tracking-normal` | Task card titles, list view row titles |
| **Body Text** | `text-sm font-normal` | `400` | `tracking-normal` | Task descriptions, comment bodies |
| **Metadata / Badges** | `text-xs font-medium` | `500` | `tracking-normal` | Priority badges, due dates, author tags |
| **Code / Expression** | `text-xs font-mono` | `400` | `tracking-tight` | Rule triggers, condition values, IDs |

---

## 5. Border Radius Hierarchy

Adhere strictly to standard border radii across all UI elements:

| Radius Token | Tailwind Class | Pixel Size | Components |
| :--- | :--- | :--- | :--- |
| **Small** | `rounded-md` | `6px` | Badges, tags, form input fields, select triggers, table cells |
| **Medium** | `rounded-lg` | `8px` | Task cards, dropdown menus, popovers, notification items |
| **Large** | `rounded-xl` | `12px` | Dialog modals, slide-over sheets, rule builder canvas nodes |
| **Pill / Circle** | `rounded-full` | `9999px` | Avatars, presence indicators, status dots, icon buttons |

---

## 6. Component Guidelines (shadcn/ui & Radix UI)

### 6.1 Buttons & Interactive Controls
- **Primary CTA**: `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98] transition-all`
- **Secondary / Ghost**: `bg-secondary text-secondary-foreground hover:bg-zinc-800 border border-zinc-800`
- **Destructive**: `bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30`
- **Icon Button**: `size-8 p-0 rounded-md hover:bg-zinc-800/80 text-muted-foreground hover:text-foreground`

### 6.2 Form Inputs & Validation (React Hook Form + Zod)
- **Input & Textarea**:
  `bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`
- **Form Labels**:
  `text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block`
- **Validation Messages**:
  `<FormMessage className="text-xs text-rose-400 mt-1 font-medium" />`

### 6.3 Badges & Status Pills
- Compact inline badge: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border`
- Task Priority Badges:
  - **Urgent**: `bg-rose-500/10 text-rose-400 border-rose-500/20`
  - **High**: `bg-amber-500/10 text-amber-400 border-amber-500/20`
  - **Medium**: `bg-blue-500/10 text-blue-400 border-blue-500/20`
  - **Low**: `bg-slate-500/10 text-slate-400 border-slate-500/20`

### 6.4 Iconography (Lucide React)
- Use `lucide-react` icons with `strokeWidth={1.75}` for a modern, crisp look.
- **Sizing Scale**:
  - `size-3.5` (14px): Inline with metadata, tiny badges, subtask indicators.
  - `size-4` (16px): Inside buttons, input leading icons, dropdown menu items.
  - `size-5` (20px): Sidebar navigation icons, topbar action icons.
  - `size-6` (24px): Empty state illustrations, dialog section icons.

---

## 7. Layout Architecture & Feature Views

### 7.1 Workspace Shell
- **Left Sidebar**: 240px fixed width, collapsible. Dark zinc surface (`bg-[#121215] border-r border-zinc-800/80`). Features workspace switcher dropdown, navigation links, and project lists.
- **Top Navbar**: 56px sticky glassmorphism header (`backdrop-blur-md bg-[#09090b]/80 border-b border-zinc-800/60`). Includes breadcrumb path, real-time collaborator avatars, `Cmd+K` command search, notification bell with unread badge, and user avatar.
- **Main Viewport**: Responsive container with sticky sub-headers for view tabs (Kanban, List, Calendar), search/filter toolbar, and primary "+ New Task" button.

### 7.2 Kanban Board Layout
- Horizontally scrollable board with custom thin scrollbar.
- Columns: Fixed `w-80` (320px) width, background `bg-[#121215]/60 border border-zinc-800/60 rounded-xl p-3 flex flex-col gap-2.5`.
- Task Cards: `bg-[#18181b] border border-zinc-800/80 rounded-lg p-3 shadow-sm hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing`.
- Drag Overlay: Slight 3-degree tilt, elevated shadow (`shadow-2xl shadow-black/80 ring-2 ring-primary/40`).

### 7.3 Task Detail Modal / Slide-over Drawer
- Responsive dialog or slide-over drawer with `rounded-xl border border-zinc-800 bg-[#121215] shadow-2xl`.
- **Split Layout**:
  - **Left Panel (65%)**: Large editable title, rich markdown description with live preview toggle, subtask checklist with animated progress bar, and real-time comment feed.
  - **Right Panel (35%)**: Metadata sidebar with status select, priority picker, assignee combobox, due date calendar, labels, and rule execution history.

### 7.4 Automation Rule Canvas
- Visual node tree with `rounded-xl bg-[#18181b] border border-zinc-800 p-4 shadow-sm`.
- Connected vertically by animated pulse connectors with Lucide `ArrowDown` icons.
- Interactive status pill: `Active` (Emerald glow), `Disabled` (Zinc muted), `Tested` (Indigo glow).

### 7.5 Analytics Dashboard
- Bento-grid layout with summary metric cards (Velocity, Open/Done ratio, Avg Cycle Time, Overdue).
- Recharts visualizations styled with custom SVG linear gradients and glassmorphism hover tooltips (`backdrop-blur-md bg-zinc-900/90 border border-zinc-800 text-xs rounded-lg p-2.5 shadow-xl`).

---

## 8. Micro-Animations & Transitions

- **Transitions**: Standard `transition-all duration-150 ease-out` on interactive surfaces.
- **Button Press**: `active:scale-[0.98]` for tactile feedback.
- **Modal Entry**: `animate-in fade-in zoom-in-95 duration-200 ease-out`.
- **Skeleton Shimmer**: Animated subtle gradient wave (`bg-gradient-to-r from-zinc-800 via-zinc-700/50 to-zinc-800 bg-[length:200%_100%] animate-shimmer`).

---

## 9. Feature Implementation Rule

> **MANDATORY**: Before implementing or reviewing any frontend component or view:
> 1. Verify that all colors, surfaces, borders, and typography conform to the tokens in this file.
> 2. Ensure zero arbitrary hex codes exist in JSX.
> 3. Use shadcn/ui primitives, React Hook Form + Zod, and Lucide icons exclusively.
