"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ViewMode } from "@/lib/types";
import { List, CalendarDays } from "lucide-react";

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <Tabs defaultValue={currentView} onValueChange={(value) => onViewChange(value as ViewMode)} className="w-full my-4">
      <TabsList className="grid w-full grid-cols-2 md:w-auto">
        <TabsTrigger value="list">
          <List className="mr-2 h-4 w-4" />
          List View
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar View
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
