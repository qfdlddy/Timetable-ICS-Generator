
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload } from 'lucide-react';

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

  return (
    <div className="flex flex-wrap gap-2 my-4">
      <Button variant="destructive" onClick={onClearAll} disabled={!hasCourses}>
        <Trash2 className="mr-2 h-4 w-4" /> Clear All Courses
      </Button>
      <Button onClick={onExportICS} disabled={!hasCourses}>
        <Download className="mr-2 h-4 w-4" /> Export ICS
      </Button>
      <Button onClick={handleImportButtonClick}>
        <Upload className="mr-2 h-4 w-4" /> Import from TXT
      </Button>
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

