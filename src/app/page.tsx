
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseInputForm } from '@/components/schedulewise/course-input-form';
import { CourseActions } from '@/components/schedulewise/course-actions';
import { ViewSwitcher } from '@/components/schedulewise/view-switcher';
import { CourseListView } from '@/components/schedulewise/course-list-view';
import { CourseCalendarView } from '@/components/schedulewise/course-calendar-view';
import type { Course, ViewMode } from '@/lib/types';
import { WEEKDAYS, AM_PM_OPTIONS, type Weekday, type AmPm } from '@/lib/constants';
import { convertTo24HourFormat } from '@/lib/date-utils';
import { generateAndDownloadICS } from '@/lib/ics-generator';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck, CalendarClock, Moon, Sun } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';


const shortToLongWeekday: Record<string, Weekday | undefined> = {
  "Mon": "Monday",
  "Tue": "Tuesday",
  "Wed": "Wednesday",
  "Thu": "Thursday",
  "Fri": "Friday",
  "Sat": "Saturday",
  "Sun": "Sunday",
};


export default function ScheduleWisePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);


  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    // Initialize calendarCurrentDate on client only
    setCalendarCurrentDate(new Date());
  }, []);


  useEffect(() => {
    const storedCourses = localStorage.getItem('scheduleWiseCourses');
    if (storedCourses) {
      try {
        const parsedCourses: any[] = JSON.parse(storedCourses);
        if (Array.isArray(parsedCourses)) {
          const sanitizedCourses: Course[] = parsedCourses.map((course: any) => ({
            id: typeof course.id === 'string' ? course.id : uuidv4(),
            title: typeof course.title === 'string' ? course.title : 'Untitled Course',
            weekday: typeof course.weekday === 'string' && WEEKDAYS.includes(course.weekday as Weekday) ? course.weekday : WEEKDAYS[0],
            startDate: typeof course.startDate === 'string' ? course.startDate : format(new Date(), 'yyyy-MM-dd'),
            endDate: typeof course.endDate === 'string' ? course.endDate : format(new Date(), 'yyyy-MM-dd'),
            startTime: typeof course.startTime === 'string' ? course.startTime : '09:00',
            duration: typeof course.duration === 'number' && !isNaN(course.duration) ? course.duration : 1,
            location: typeof course.location === 'string' ? course.location : '',
            description: typeof course.description === 'string' ? course.description : '',
            excludedDates: Array.isArray(course.excludedDates)
              ? course.excludedDates.filter((d: any) => typeof d === 'string')
              : [],
          })).filter(c => c.title !== 'Untitled Course' || c.id !== '');
          
          setCourses(sanitizedCourses);
        } else {
          console.warn("Stored courses data is invalid (not an array). Resetting.");
          localStorage.removeItem('scheduleWiseCourses');
          setCourses([]);
        }
      } catch (error) {
        console.error("Failed to parse stored courses:", error);
        localStorage.removeItem('scheduleWiseCourses');
        setCourses([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scheduleWiseCourses', JSON.stringify(courses));
  }, [courses]);


  const handleSubmitCourseFromForm = (courseData: Course, isEdit: boolean) => {
    if (isEdit) {
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseData.id ? courseData : course
        )
      );
      toast({ title: "Course Updated!", description: `"${courseData.title}" has been successfully updated.` });
      setIsEditModalOpen(false);
      setEditingCourse(null);
    } else {
      setCourses(prevCourses => [...prevCourses, courseData]);
      toast({
        title: 'Course Added!',
        description: `"${courseData.title}" has been successfully added to your schedule.`,
        className: "bg-primary text-primary-foreground"
      });
      // Date range and other fields persist after adding.
    }
  };

  const handleOpenEditModal = (courseId: string) => {
    const courseToEdit = courses.find(c => c.id === courseId);
    if (courseToEdit) {
      setEditingCourse(courseToEdit);
      setIsEditModalOpen(true);
    }
  };
  
  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    if (!courseToDelete) return;

    if (window.confirm(`Are you sure you want to delete the course "${courseToDelete.title}"? This action cannot be undone.`)) {
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      toast({
        title: 'Course Deleted',
        description: `"${courseToDelete.title}" has been removed from your schedule.`,
        variant: 'destructive',
      });
    }
  };

  const handleClearAllCourses = () => {
    if (courses.length === 0) {
        toast({ title: 'No Courses', description: 'The schedule is already empty.', variant: 'default' });
        return;
    }
    const confirmed = window.confirm("Are you sure you want to clear all courses? This action cannot be undone.");
    if (confirmed) {
      setCourses([]);
      toast({ title: 'Schedule Cleared', description: 'All courses have been removed.', variant: 'destructive' });
    }
  };

  const handleExportICS = () => {
    if (courses.length === 0) {
        toast({ title: 'No Courses to Export', description: 'Please add some courses first.', variant: 'default' });
        return;
    }
    try {
        generateAndDownloadICS(courses);
        setCourses([]); // Clear all courses after successful export
        toast({ title: 'Export Successful & Schedule Cleared', description: 'Your schedule has been exported and all courses cleared.' });
        setFormResetKey(prevKey => prevKey + 1); // Reset the form after successful export and clearing courses
    } catch (error) {
        console.error("ICS Export Error:", error);
        toast({ title: 'Export Failed', description: 'There was an error exporting your schedule.', variant: 'destructive' });
    }
  };

  const handleImportTXT = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: 'Import Failed', description: 'File is empty or could not be read.', variant: 'destructive' });
        return;
      }

      const allLines = text.split('\n');
      let globalStartDateStr = format(new Date(), 'yyyy-MM-dd');
      let globalEndDateStr = format(new Date(), 'yyyy-MM-dd');
      let linesForCourseProcessing: string[];
      let dateRangeMessage = "Courses defaulted to current date (no valid global date range found in TXT).";
      let initialLineOffset = 0;

      if (allLines.length > 0) {
        const firstLineTrimmed = allLines[0].trim(); 
        const dateRangeRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/;
        const match = firstLineTrimmed.match(dateRangeRegex);

        if (match) {
          linesForCourseProcessing = allLines.slice(1); 
          initialLineOffset = 1;
          try {
            const parsedStartDate = parse(match[1], 'd/M/yyyy', new Date());
            const parsedEndDate = parse(match[2], 'd/M/yyyy', new Date());

            if (isValid(parsedStartDate) && isValid(parsedEndDate)) {
              if (parsedEndDate < parsedStartDate) {
                dateRangeMessage = "Global end date in TXT was before start date. Courses defaulted to current date.";
              } else {
                globalStartDateStr = format(parsedStartDate, 'yyyy-MM-dd');
                globalEndDateStr = format(parsedEndDate, 'yyyy-MM-dd');
                dateRangeMessage = `Global date range ${format(parsedStartDate, 'PPP')} - ${format(parsedEndDate, 'PPP')} applied from TXT.`;
              }
            } else {
              dateRangeMessage = "Invalid date format in global date range line in TXT. Courses defaulted to current date.";
            }
          } catch (err) {
            dateRangeMessage = "Error parsing global date range line in TXT. Courses defaulted to current date.";
          }
        } else {
          linesForCourseProcessing = allLines;
        }
      } else {
          linesForCourseProcessing = [];
          dateRangeMessage = "File is empty. No courses imported.";
      }
      
      const importedCourses: Course[] = [];
      const importErrors: string[] = [];
      const courseLinesPerBlock = 7;
      
      const actualCourseLines = linesForCourseProcessing.map(line => line.trim()).filter(line => line !== "");

      for (let i = 0; i < actualCourseLines.length; i += courseLinesPerBlock) {
          const blockLines = actualCourseLines.slice(i, i + courseLinesPerBlock);
          const currentCourseBlockIndex = (i / courseLinesPerBlock) + 1;

          if (blockLines.length < courseLinesPerBlock) {
              if (blockLines.some(line => line.trim() !== "")) { 
                   importErrors.push(`Course block ${currentCourseBlockIndex} (approx. original line ${initialLineOffset + i + 1}): Incomplete block (expected ${courseLinesPerBlock} lines, got ${blockLines.length}). Skipped.`);
              }
              continue; 
          }
        
          const [rawTitle, rawWeekday, rawStartTime, rawAmPm, rawDuration, rawLocation, rawDescription] = blockLines;
          let blockHasErrors = false;

          if (!rawTitle) {
            importErrors.push(`Course block ${currentCourseBlockIndex}: Title is missing. Skipped.`);
            blockHasErrors = true;
          }
          
          const weekdayKey = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1).toLowerCase();
          const weekday = shortToLongWeekday[weekdayKey];
          if (!weekday && !blockHasErrors) {
            importErrors.push(`Course block ${currentCourseBlockIndex} ('${rawTitle || 'Untitled'}'): Invalid weekday "${rawWeekday}". Expected Mon, Tue, etc. Skipped.`);
            blockHasErrors = true;
          }

          let formattedStartTime12h = "";
          if (!blockHasErrors) {
              try {
                let [hPart, mPart] = rawStartTime.split('.');
                if (!hPart) throw new Error("Hour part missing");
                if (!mPart) mPart = "00"; 
                else mPart = mPart.padEnd(2,'0').substring(0,2); 
                
                const hours12 = hPart.padStart(2, '0');
                const minutes12 = mPart;
                
                if (parseInt(hours12, 10) < 1 || parseInt(hours12, 10) > 12 || parseInt(minutes12, 10) < 0 || parseInt(minutes12, 10) > 59) {
                  throw new Error("Invalid hour or minute value for 12-hour format.");
                }
                formattedStartTime12h = `${hours12}:${minutes12}`;
              } catch (err) {
                importErrors.push(`Course block ${currentCourseBlockIndex} ('${rawTitle || 'Untitled'}'): Invalid start time format "${rawStartTime}". Expected H.MM, HH.MM, H, or HH. Skipped. ${err instanceof Error ? err.message : ''}`);
                blockHasErrors = true;
              }
          }
          
          const ampm = rawAmPm.toUpperCase() as AmPm;
          if (!AM_PM_OPTIONS.includes(ampm) && !blockHasErrors) {
            importErrors.push(`Course block ${currentCourseBlockIndex} ('${rawTitle || 'Untitled'}'): Invalid AM/PM value "${rawAmPm}". Expected AM or PM. Skipped.`);
            blockHasErrors = true;
          }

          let startTime24 = "";
          if (!blockHasErrors) {
              try {
                  startTime24 = convertTo24HourFormat(formattedStartTime12h, ampm);
              } catch (err) {
                  importErrors.push(`Course block ${currentCourseBlockIndex} ('${rawTitle || 'Untitled'}'): Error converting time "${formattedStartTime12h} ${ampm}" to 24-hour format. Skipped. ${err instanceof Error ? err.message : ''}`);
                  blockHasErrors = true;
              }
          }

          const duration = parseFloat(rawDuration);
          if ((isNaN(duration) || duration <= 0) && !blockHasErrors) {
            importErrors.push(`Course block ${currentCourseBlockIndex} ('${rawTitle || 'Untitled'}'): Invalid duration "${rawDuration}". Must be a positive number. Skipped.`);
            blockHasErrors = true;
          }

          if (!blockHasErrors) {
              importedCourses.push({
                id: uuidv4(),
                title: rawTitle,
                weekday: weekday!, 
                startDate: globalStartDateStr,
                endDate: globalEndDateStr,
                startTime: startTime24,
                duration,
                location: rawLocation || 'N/A',
                description: rawDescription || '',
                excludedDates: [],
              });
          }
      }
      
      let toastTitle = 'Import Processed';
      let toastVariant: "default" | "destructive" = "default";
      let fullToastDescription = `${importedCourses.length} course(s) imported. ${dateRangeMessage}`;

      if (importErrors.length > 0) {
        fullToastDescription += ` ${importErrors.length} issue(s) found during import. Check console for details.`;
        console.warn("Detailed errors during TXT import:");
        importErrors.forEach(err => console.warn(err));
      }

      if (importedCourses.length > 0) {
        setCourses(prevCourses => [...prevCourses, ...importedCourses]);
      } else if (actualCourseLines.length > 0 && importErrors.length > 0) { 
        toastTitle = 'Import Failed';
        toastVariant = 'destructive';
        fullToastDescription = `No courses imported due to errors. ${dateRangeMessage} ${importErrors.length > 0 ? `${importErrors.length} issue(s) found. Check console for details.` : ''}`;
      } else if (actualCourseLines.length > 0 && importedCourses.length === 0 && importErrors.length === 0) {
        toastTitle = 'Import Information';
        toastVariant = 'default';
        fullToastDescription = `No complete 7-line course blocks found in TXT file. Ensure each course has 7 lines of details. ${dateRangeMessage}`;
      } else if (actualCourseLines.length === 0 ) { 
        toastTitle = 'Import Information';
        fullToastDescription = `No course data found in the TXT file (after processing optional date range line). ${dateRangeMessage}`;
      }
      
      toast({
        title: toastTitle,
        description: fullToastDescription,
        variant: toastVariant,
        duration: importErrors.length > 0 || (importedCourses.length === 0 && actualCourseLines.length > 0) ? 10000 : 5000,
      });

    };
    reader.onerror = () => {
      toast({ title: 'Import Failed', description: 'Error reading file.', variant: 'destructive' });
    };
    reader.readAsText(file);
  };


  const handleExcludeDate = (courseId: string, dateToExclude: string) => {
    setCourses(prevCourses =>
      prevCourses.map(course => {
        if (course.id === courseId) {
          const updatedExcludedDates = Array.isArray(course.excludedDates) ? course.excludedDates : [];
          if (!updatedExcludedDates.includes(dateToExclude)) {
            return {
              ...course,
              excludedDates: [...updatedExcludedDates, dateToExclude].sort(),
            };
          }
        }
        return course;
      })
    );
    const course = courses.find(c => c.id === courseId);
    toast({
      title: 'Occurrence Removed',
      description: `The occurrence of "${course?.title}" on ${format(new Date(dateToExclude + 'T00:00:00'), 'PPP')} has been removed from the calendar.`,
    });
  };
  
  const handleCalendarDateChange = (date: Date) => {
    setCalendarCurrentDate(date);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-muted-foreground">Loading ScheduleWise...</div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col font-sans">
      <header className="mb-8 text-center relative">
        <div className="absolute top-0 right-0">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
            >
                {resolvedTheme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </Button>
        </div>
        <div className="flex items-center justify-center mb-2">
          <CalendarClock className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">Schedule<span className="text-primary">Wise</span></h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Intelligently plan your courses and manage your academic schedule with ease.
        </p>
      </header>

      <Card className="mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
             <BookOpenCheck className="mr-2 h-6 w-6 text-accent" />
             Add New Course
          </CardTitle>
          <CardDescription>
            Fill in the details for your course. Required fields are marked. Imported courses may need Start/End Dates adjusted if not provided in TXT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseInputForm
            key={`add-form-${formResetKey}`}
            onSubmitCourse={handleSubmitCourseFromForm}
          />
        </CardContent>
      </Card>

      <CourseActions
        onClearAll={handleClearAllCourses}
        onExportICS={handleExportICS}
        onImportTXT={handleImportTXT}
        hasCourses={courses.length > 0}
      />
      
      <Separator className="my-6" />

      <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-grow">
        {currentView === 'list' ? (
          <CourseListView courses={courses} onEditCourse={handleOpenEditModal} onDeleteCourse={handleDeleteCourse} />
        ) : calendarCurrentDate ? (
          <CourseCalendarView 
            courses={courses} 
            currentCalendarDate={calendarCurrentDate}
            setCurrentCalendarDate={handleCalendarDateChange}
            onExcludeDate={handleExcludeDate}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>
        )}
      </div>

      {isEditModalOpen && editingCourse && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => {
          setIsEditModalOpen(isOpen);
          if (!isOpen) setEditingCourse(null);
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BookOpenCheck className="mr-2 h-6 w-6 text-accent" />
                Edit Course: {editingCourse.title}
              </DialogTitle>
              <DialogDescription>
                Update the details for your course.
              </DialogDescription>
            </DialogHeader>
            <CourseInputForm
              key={`edit-form-${editingCourse.id}`}
              initialData={editingCourse}
              onSubmitCourse={handleSubmitCourseFromForm}
            />
          </DialogContent>
        </Dialog>
      )}
      
      <footer className="text-center mt-12 py-6 border-t">
        <p className="text-sm text-muted-foreground">
          ScheduleWise &copy; {new Date().getFullYear()}. Your smart scheduling assistant.
        </p>
      </footer>
    </div>
  );
}

