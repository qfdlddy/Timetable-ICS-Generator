
"use client";

import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimeForDisplay } from "@/lib/date-utils";
import { format } from "date-fns"; // Added for formatting date to yyyy-MM-dd

interface DayCellProps {
  date: Date | null;
  coursesOnThisDay: Course[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onExcludeDate?: (courseId: string, date: string) => void;
}

export function DayCell({ date, coursesOnThisDay, isCurrentMonth, isToday, onExcludeDate }: DayCellProps) {
  if (!date) {
    return <div className="border p-1 min-h-[100px] bg-muted/30"></div>;
  }

  const dayNumber = date.getDate();
  const formattedDateStr = format(date, "yyyy-MM-dd"); // For passing to onExcludeDate

  const handleCourseClick = (course: Course) => {
    if (!onExcludeDate || !date) return;
    
    const displayDate = format(new Date(formattedDateStr + 'T00:00:00'), "PPP"); 
    if (window.confirm(`Are you sure you want to remove this occurrence of "${course.title}" on ${displayDate}?`)) {
      onExcludeDate(course.id, formattedDateStr);
    }
  };

  return (
    <div
      className={cn(
        "border p-1 min-h-[120px] flex flex-col relative rounded-md shadow-sm",
        isCurrentMonth ? "bg-card" : "bg-muted/50",
        isToday && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className={cn("text-sm font-medium self-end pb-1 pr-1", !isCurrentMonth && "text-muted-foreground/70")}>
        {dayNumber}
      </div>
      <ScrollArea className="flex-grow">
        <div className="space-y-1 pr-1">
        {coursesOnThisDay.map((course, index) => (
            <TooltipProvider key={course.id + index} delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                <div 
                    className={cn(
                        "bg-primary/80 text-primary-foreground text-xs p-1 rounded truncate",
                        onExcludeDate && "cursor-pointer hover:bg-primary" // Add hover effect if clickable
                    )}
                    onClick={() => onExcludeDate && handleCourseClick(course)}
                    title={onExcludeDate ? `Click to remove this occurrence of ${course.title}` : course.title}
                >
                    {course.title.length > 12 ? `${course.title.substring(0,10)}...` : course.title}
                </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                <p className="font-semibold">{course.title}</p>
                <p>Time: {formatTimeForDisplay(course.startTime)} ({course.duration}h)</p>
                <p>Location: {course.location}</p>
                {course.description && <p>Lecturer: {course.description}</p>}
                {onExcludeDate && <p className="text-xs text-muted-foreground italic mt-1">Click to remove this specific occurrence.</p>}
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        ))}
        </div>
      </ScrollArea>
    </div>
  );
}

    
