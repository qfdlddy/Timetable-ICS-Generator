
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIconLucide } from "lucide-react";
import { cn } from '@/lib/utils';

interface CalendarControlsProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateSelect: (date: Date) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarControls({ currentDate, onPrevMonth, onNextMonth, onDateSelect }: CalendarControlsProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const currentMonthName = MONTH_NAMES[currentDate.getMonth()];
  const currentYearValue = currentDate.getFullYear();
  const monthYearLabel = `${currentMonthName} ${currentYearValue}`;

  const years = Array.from({ length: 21 }, (_, i) => currentYearValue - 10 + i);

  const handleMonthSelect = (monthIndex: string) => {
    const newMonth = parseInt(monthIndex, 10);
    if (!isNaN(newMonth)) {
      const newDate = new Date(currentYearValue, newMonth, 1);
      onDateSelect(newDate);
      setIsDatePickerOpen(false);
    }
  };

  const handleYearSelect = (year: string) => {
    const newYear = parseInt(year, 10);
    if (!isNaN(newYear)) {
      const newDate = new Date(newYear, currentDate.getMonth(), 1);
      onDateSelect(newDate);
      setIsDatePickerOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2">
      <Button variant="outline" size="icon" onClick={onPrevMonth} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-auto text-base font-semibold hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md"
            )}
          >
            <CalendarIconLucide className="mr-2 h-5 w-5 opacity-70" />
            {monthYearLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 space-y-2" align="center">
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={currentDate.getMonth().toString()}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentYearValue.toString()}
              onValueChange={handleYearSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={onNextMonth} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
