"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Kanban,
  List,
  Calendar,
  Search,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BoardHeaderProps {
  projectId: string;
  projectName: string;
  projectKey: string;
  projectDescription?: string | null;
  workspaceId: string;
  currentView?: string;
  canManage?: boolean;
  onAddTask?: () => void;
}

export function BoardHeader({
  projectName,
  projectKey,
  projectDescription,
  currentView = "kanban",
  canManage = true,
  onAddTask,
}: BoardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeView = searchParams.get("view") || currentView;

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4 pb-4 border-b border-zinc-800/80">
      {/* Project Title & Key */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {projectName}
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-xs font-semibold px-2 py-0.5 border-primary/30 bg-primary/10 text-primary uppercase"
            >
              {projectKey}
            </Badge>
          </div>
          {projectDescription && (
            <p className="text-xs text-muted-foreground max-w-2xl">
              {projectDescription}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              onClick={onAddTask}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98] transition-all"
            >
              <Plus className="size-4" />
              <span>Add Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar: Views Switcher & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* View Switcher Tabs */}
        <Tabs
          value={activeView}
          onValueChange={handleViewChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-zinc-900/90 border border-zinc-800">
            <TabsTrigger
              value="kanban"
              onClick={() => handleViewChange("kanban")}
              className="gap-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-foreground"
            >
              <Kanban className="size-3.5 text-zinc-400" />
              <span>Kanban</span>
            </TabsTrigger>
            <TabsTrigger
              value="list"
              onClick={() => handleViewChange("list")}
              className="gap-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-foreground"
            >
              <List className="size-3.5 text-zinc-400" />
              <span>List</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              onClick={() => handleViewChange("calendar")}
              className="gap-1.5 text-xs data-[state=active]:bg-[#18181b] data-[state=active]:text-foreground"
            >
              <Calendar className="size-3.5 text-zinc-400" />
              <span>Calendar</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <Input
              placeholder="Filter tasks..."
              className="h-8 pl-8 pr-3 text-xs bg-zinc-900/50 border-zinc-800 rounded-lg placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-zinc-800"
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
