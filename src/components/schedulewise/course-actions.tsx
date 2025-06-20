
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CourseActionsProps {
  onClearAll: () => void;
  onExportICS: () => void;
  onImportTXT: (file: File) => void;
  hasCourses: boolean;
}

export function CourseActions({
  onClearAll,
  onExportICS,
  onImportTXT,
  hasCourses,
}: CourseActionsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportTXT(file);
      // Reset the input value to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const txtFormatTooltipContent = (
    <div className="text-left p-1">
      <p className="font-semibold mb-1">TXT File Format:</p>
      <p className="text-xs text-muted-foreground mb-2">
        Line 1 (Optional): Global Date Range (e.g., DD/MM/YYYY - DD/MM/YYYY)
      </p>
      <hr className="my-1 border-border" />
      <p className="font-semibold mt-1 mb-1">For each course (7 lines):</p>
      <ul className="list-disc list-inside text-xs space-y-0.5">
        <li>Line 1: Course Title</li>
        <li>Line 2: Weekday (Mon, Tue, Wed, Thu, Fri, Sat, Sun)</li>
        <li>Line 3: Start Time (e.g., 9.30 for 9:30, 1.0 for 1:00)</li>
        <li>Line 4: AM/PM</li>
        <li>Line 5: Duration (in hours, e.g., 1.5)</li>
        <li>Line 6: Location</li>
        <li>Line 7: Lecturer</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-2">
        Subsequent courses follow immediately (no blank lines needed between courses).
      </p>
    </div>
  );


  return (
    <div className="flex flex-wrap items-center gap-2 my-4">
      <Button variant="destructive" onClick={onClearAll} disabled={!hasCourses}>
        <Trash2 className="mr-2 h-4 w-4" /> Clear All Courses
      </Button>
      <Button onClick={onExportICS} disabled={!hasCourses}>
        <Download className="mr-2 h-4 w-4" /> Export ICS
      </Button>
      <div className="flex items-center gap-1">
        <Button onClick={handleImportButtonClick}>
          <Upload className="mr-2 h-4 w-4" /> Import from TXT
        </Button>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs md:max-w-sm bg-background border-border shadow-lg p-3">
              {txtFormatTooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

