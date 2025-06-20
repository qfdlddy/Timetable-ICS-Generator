
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/types";
import { formatTimeForDisplay } from "@/lib/date-utils";
import { Pencil, Trash2 } from "lucide-react";

interface CourseListViewProps {
  courses: Course[];
  onEditCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
}

export function CourseListView({ courses, onEditCourse, onDeleteCourse }: CourseListViewProps) {
  if (courses.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No courses added yet. Add a course using the form above.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableCaption>A list of your scheduled courses.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Title</TableHead>
            <TableHead>Weekday</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Duration (H)</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Lecturer</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.title}</TableCell>
              <TableCell>{course.weekday}</TableCell>
              <TableCell>{course.startDate}</TableCell>
              <TableCell>{course.endDate}</TableCell>
              <TableCell>{formatTimeForDisplay(course.startTime)}</TableCell>
              <TableCell className="text-right">{course.duration.toFixed(1)}</TableCell>
              <TableCell>{course.location}</TableCell>
              <TableCell>{course.description || "-"}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEditCourse(course.id)} aria-label="Edit course">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDeleteCourse(course.id)} aria-label="Delete course">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
