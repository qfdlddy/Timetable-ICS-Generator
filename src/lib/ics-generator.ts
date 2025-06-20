
'use client';
import { type Course } from './types';
import { WEEKDAY_MAP_ICS } from './constants';
import * as ics from 'ics';
import { saveAs } from 'file-saver';

// Helper function to convert YYYY-MM-DD and HH:MM to date array for ics
const toDateArray = (dateStr: string, timeStr: string): ics.DateArray => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return [year, month, day, hours, minutes];
};

// Helper to get the first occurrence of a weekday on or after a start date
const getFirstEventDateTime = (startDateStr: string, startTimeStr: string, targetWeekday: string): Date => {
  const courseStartDate = new Date(`${startDateStr}T00:00:00`); // Use T00:00:00 to avoid timezone issues with date part
  const targetWeekdayIndex = Object.keys(WEEKDAY_MAP_ICS).indexOf(targetWeekday); 

  const localStartDateWeekday = courseStartDate.getDay(); // 0=Sun, 1=Mon,...
  const targetJSWeekday = (targetWeekdayIndex + 1) % 7; // Convert MO=0 (from WEEKDAY_MAP_ICS keys) to JS Mon=1

  let daysToAdd = (targetJSWeekday - localStartDateWeekday + 7) % 7;

  const firstEventDate = new Date(courseStartDate);
  firstEventDate.setDate(courseStartDate.getDate() + daysToAdd);
  
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  firstEventDate.setHours(hours, minutes, 0, 0);
  return firstEventDate;
};


export const generateAndDownloadICS = (courses: Course[], defaultTimezone?: string) => {
  if (!courses.length) {
    console.warn('No courses to export.');
    return;
  }

  const events: ics.EventAttributes[] = [];
  const userTimezone = defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  courses.forEach((course, index) => {
    try {
      const firstEventDateTimeLocal = getFirstEventDateTime(course.startDate, course.startTime, course.weekday);
      
      const startDateTime: ics.DateArray = [
        firstEventDateTimeLocal.getFullYear(),
        firstEventDateTimeLocal.getMonth() + 1,
        firstEventDateTimeLocal.getDate(),
        firstEventDateTimeLocal.getHours(),
        firstEventDateTimeLocal.getMinutes()
      ];
      
      const endDateObj = new Date(`${course.endDate}T23:59:59`);
      // UNTIL part of RRULE should be in UTC according to RFC 5545.
      // Format as YYYYMMDDTHHMMSSZ
      const untilDateUTCString = 
        endDateObj.getUTCFullYear() +
        (endDateObj.getUTCMonth() + 1).toString().padStart(2, '0') +
        endDateObj.getUTCDate().toString().padStart(2, '0') +
        'T' +
        endDateObj.getUTCHours().toString().padStart(2, '0') +
        endDateObj.getUTCMinutes().toString().padStart(2, '0') +
        endDateObj.getUTCSeconds().toString().padStart(2, '0') +
        'Z';

      if (firstEventDateTimeLocal > endDateObj) {
        console.warn(`Skipping course "${course.title}" as its first occurrence is after its end date.`);
        return;
      }
      
      const durationHours = Math.floor(course.duration);
      const durationMinutes = Math.round((course.duration - durationHours) * 60);

      const event: ics.EventAttributes = {
        title: course.title,
        start: startDateTime,
        duration: { hours: durationHours, minutes: durationMinutes },
        location: course.location || undefined,
        description: course.description ? `Lecturer: ${course.description}` : undefined,
        uid: `schedulewise-${course.id}-${index}@example.com`,
        startInputType: 'local', 
        startOutputType: 'local', // Keep output as local if start was local. Some calendars prefer this.
        calName: 'ScheduleWise Calendar',
        productId: 'ScheduleWiseApp',
        alarms: [
          {
            action: 'display',
            description: 'Reminder',
            trigger: { hours: 0, minutes: 10, before: true },
          },
        ],
        recurrenceRule: `FREQ=WEEKLY;BYDAY=${WEEKDAY_MAP_ICS[course.weekday as keyof typeof WEEKDAY_MAP_ICS]};INTERVAL=1;UNTIL=${untilDateUTCString}`,
      };

      // Add excluded dates (EXDATE)
      if (course.excludedDates && course.excludedDates.length > 0) {
        event.exdate = course.excludedDates
          .map(exDateStr => {
            // exDateStr is "YYYY-MM-DD", course.startTime is "HH:MM" (24h local)
            // EXDATE should match the time of the original occurrences.
            // Since `start` is local, `exdate` should also be local.
            return toDateArray(exDateStr, course.startTime);
          })
          // Filter out any exdates that might be outside the event's main range, though `ics` lib or calendar might handle this.
          .filter(exDateArray => {
            const exDateTime = new Date(exDateArray[0], exDateArray[1]-1, exDateArray[2], exDateArray[3], exDateArray[4]);
            const courseStartDateTime = new Date(course.startDate + "T" + course.startTime);
            const courseEndDateTime = new Date(course.endDate + "T23:59:59");
            return exDateTime >= courseStartDateTime && exDateTime <= courseEndDateTime;
          });
        if (event.exdate.length === 0) delete event.exdate; // Clean up if all filtered out
      }

      events.push(event);
    } catch (error) {
      console.error(`Error processing course "${course.title}" for ICS:`, error);
    }
  });

  if (!events.length) {
    console.warn('No valid events generated for ICS.');
    return;
  }
  
  const { error, value } = ics.createEvents(events);

  if (error) {
    console.error('Error creating ICS file:', error);
    return;
  }

  if (value) {
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, 'ScheduleWise_Courses.ics');
  }
};

    