
import { type AmPm } from "./constants";

export const convertTo24HourFormat = (time12h: string, ampm: AmPm): string => {
  if (!time12h.match(/^\d{1,2}:\d{2}$/)) {
    throw new Error("Invalid time format. Expected HH:MM or H:MM.");
  }
  let [hoursStr, minutesStr] = time12h.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time values. Hours must be 1-12, minutes 0-59.");
  }

  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    // Midnight case
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const convertTo12HourFormat = (time24h: string): { time: string; ampm: AmPm } => {
  if (!time24h.match(/^\d{1,2}:\d{2}$/)) {
    console.error("Invalid 24-hour time format for conversion:", time24h);
    // Fallback or throw error, for now, returning a default to avoid crashing form prefill
    return { time: "12:00", ampm: "AM" }; 
  }
  let [hoursStr, minutesStr] = time24h.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.error("Invalid 24-hour time values for conversion:", time24h);
    return { time: "12:00", ampm: "AM" }; // Fallback
  }

  const ampmRet = hours >= 12 ? "PM" : "AM";
  let hours12 = hours;
  if (hours === 0) { // Midnight case
    hours12 = 12;
  } else if (hours > 12) {
    hours12 = hours - 12;
  }
  return {
    time: `${hours12.toString()}:${minutes.toString().padStart(2, "0")}`, // No need to pad hour for 1-9 display
    ampm: ampmRet,
  };
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getMonthMatrix = (year: number, month: number): (Date | null)[][] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const totalDays = lastDayOfMonth.getDate();

  const matrix: (Date | null)[][] = [];
  let dayCounter = 1;
  let currentWeek: (Date | null)[] = [];

  // Add leading nulls for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  while (dayCounter <= totalDays) {
    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(new Date(year, month, dayCounter));
    dayCounter++;
  }

  // Add trailing nulls for days after the last day of the month
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
     matrix.push(currentWeek);
  }
 

  // Ensure 6 rows for consistent calendar height, if less, add empty weeks
  while (matrix.length < 6 && matrix.length > 0) {
    const emptyWeek = Array(7).fill(null);
    matrix.push(emptyWeek);
  }
  
  return matrix;
};

export const formatTimeForDisplay = (time24h: string): string => {
  try {
    const { time, ampm } = convertTo12HourFormat(time24h);
    // For display, ensure consistent HH:MM format, e.g., 9:30 AM should be 09:30 AM
    const [h, m] = time.split(':');
    return `${h.padStart(2, '0')}:${m} ${ampm}`;
  } catch (error) {
    console.error("Error formatting time for display:", error);
    return time24h; // Fallback to 24h format if conversion fails
  }
};
