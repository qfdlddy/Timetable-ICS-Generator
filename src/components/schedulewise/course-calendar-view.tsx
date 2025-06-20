
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Course } from '@/lib/types';
import { CalendarControls } from './calendar-controls';
import { DayCell } from './day-cell';
import { getMonthMatrix, formatTimeForDisplay } from '@/lib/date-utils'; // formatTimeForDisplay might not be needed here directly
import { DAY_HEADER_MAP } from '@/lib/constants';
import { isSameDay, isToday as checkIsToday, parseISO, format } from 'date-fns';

interface CourseCalendarViewProps {
  courses: Course[];
  currentCalendarDate: Date;
  setCurrentCalendarDate: (date: Date) => void;
  onExcludeDate: (courseId: string, date: string) => void;
}

export function CourseCalendarView({ courses, currentCalendarDate, setCurrentCalendarDate, onExcludeDate }: CourseCalendarViewProps) {
  
  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  const monthMatrix = useMemo(() => {
    return getMonthMatrix(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  }, [currentCalendarDate]);

  const getCoursesForDay = (date: Date | null): Course[] => {
    if (!date) return [];
    const formattedDateStr = format(date, 'yyyy-MM-dd');
    
    return courses.filter(course => {
      try {
        const courseStartDate = parseISO(course.startDate);
        const courseEndDate = parseISO(course.endDate);
        
        if (date < courseStartDate || date > courseEndDate) {
          return false;
        }

        // Check if this specific date is excluded for the course
        if (course.excludedDates?.includes(formattedDateStr)) {
          return false;
        }
        
        const courseWeekdayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(course.weekday);
        return date.getDay() === courseWeekdayIndex;

      } catch (e) {
        console.error("Error parsing course dates or checking exclusions:", e, course);
        return false;
      }
    });
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-lg">
      <CalendarControls
        currentDate={currentCalendarDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDateSelect={setCurrentCalendarDate} // Pass setCurrentCalendarDate as onDateSelect
      />
      <div className="grid grid-cols-7 gap-1 mt-2">
        {Object.values(DAY_HEADER_MAP).map(dayHeader => (
          <div key={dayHeader} className="text-center font-semibold text-sm text-muted-foreground p-2">
            {dayHeader}
          </div>
        ))}
        {monthMatrix.flat().map((date, index) => {
          const coursesOnThisDay = getCoursesForDay(date);
          return (
            <DayCell
              key={date ? date.toISOString() : `empty-${index}`}
              date={date}
              coursesOnThisDay={coursesOnThisDay}
              isCurrentMonth={date ? date.getMonth() === currentCalendarDate.getMonth() : false}
              isToday={date ? checkIsToday(date) : false}
              onExcludeDate={onExcludeDate}
            />
          );
        })}
      </div>
       {courses.length === 0 && monthMatrix.length > 0 && (
         <p className="text-muted-foreground text-center py-8 col-span-7">
            No courses scheduled for this month. Add courses using the form.
         </p>
       )}
    </div>
  );
}

    
