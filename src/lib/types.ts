
export interface Course {
  id: string;
  title: string;
  weekday: string; // e.g., "Monday", "Tuesday"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM" (24-hour format for internal storage)
  duration: number; // in hours
  location: string;
  description: string; // Lecturer
  excludedDates?: string[]; // Array of "YYYY-MM-DD" strings for excluded dates
}

export type ViewMode = "list" | "calendar";

    