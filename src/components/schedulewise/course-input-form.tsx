
"use client";

import type * as React from 'react';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { WEEKDAYS, AM_PM_OPTIONS, type AmPm, type Weekday } from '@/lib/constants';
import { convertTo24HourFormat, convertTo12HourFormat } from '@/lib/date-utils';
import type { Course } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const courseFormSchema = z.object({
  title: z.string().min(1, { message: 'Course title is required.' }),
  weekday: z.string().min(1, { message: 'Weekday is required.' }),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  startTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/, {
    message: 'Time must be HH:MM or H:MM (e.g., 09:30 or 1:30). Hour must be 01-12.',
  }),
  ampm: z.enum(AM_PM_OPTIONS, { required_error: 'AM/PM is required.' }),
  duration: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Duration must be a positive number.',
  }),
  location: z.string().optional(),
  description: z.string().optional(),
})
.refine(data => {
    if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
  message: "End date cannot be earlier than start date.",
  path: ["endDate"],
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseInputFormProps {
  onSubmitCourse: (course: Course, isEdit: boolean) => void;
  initialData?: Course | null;
}

export function CourseInputForm({ onSubmitCourse, initialData }: CourseInputFormProps) {
  const isEditMode = !!initialData;
  const [isDateRangePopoverOpen, setIsDateRangePopoverOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);


  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      weekday: WEEKDAYS[0],
      startTime: '',
      ampm: 'AM',
      duration: '',
      location: '',
      description: '',
      startDate: undefined,
      endDate: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      const { time: startTime12, ampm } = convertTo12HourFormat(initialData.startTime);
      form.reset({
        title: initialData.title,
        weekday: initialData.weekday,
        startDate: initialData.startDate ? parseISO(initialData.startDate) : undefined,
        endDate: initialData.endDate ? parseISO(initialData.endDate) : undefined,
        startTime: startTime12,
        ampm: ampm,
        duration: initialData.duration.toString(),
        location: initialData.location,
        description: initialData.description,
      });
    } else if (!isEditMode) {
       form.reset({
        title: '',
        weekday: WEEKDAYS[0],
        startTime: '',
        ampm: 'AM',
        duration: '',
        location: '',
        description: '',
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [initialData, isEditMode, form]);


  const handleStartTimeBlurLogic = (event: React.FocusEvent<HTMLInputElement>) => {
    const currentValue = event.target.value;
    let formattedValue = currentValue;

    if (!currentValue.includes(':') && currentValue.match(/^\d+$/)) {
      const digits = currentValue;
      switch (digits.length) {
        case 1:
          formattedValue = `0${digits}:00`;
          break;
        case 2:
          formattedValue = `${digits.padStart(2, '0')}:00`;
          break;
        case 3:
          formattedValue = `${digits.charAt(0)}:${digits.substring(1, 3)}`;
          break;
        case 4:
          formattedValue = `${digits.substring(0, 2)}:${digits.substring(2, 4)}`;
          break;
      }
    } else if (currentValue.includes(':')) {
      const parts = currentValue.split(':');
      if (parts.length === 2) {
        const h = parts[0].replace(/[^0-9]/g, '');
        const m = parts[1].replace(/[^0-9]/g, '');
        if (h !== "" && m !== "") {
          formattedValue = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        }
      }
    }
    
    if (formattedValue.includes(':')) {
        const hourPart = parseInt(formattedValue.split(':')[0], 10);
        if (hourPart < 1 || hourPart > 12) {
            // Zod will handle
        } else if (formattedValue !== currentValue) {
            form.setValue('startTime', formattedValue, { shouldValidate: true });
        }
    } else if (formattedValue !== currentValue) {
       form.setValue('startTime', formattedValue, { shouldValidate: true });
    }

    if (currentValue !== '' && !form.getFieldState('startTime').isTouched) {
      form.trigger('startTime');
    } else if (currentValue === '' && form.getFieldState('startTime').isTouched) {
       form.setValue('startTime', '', { shouldValidate: true });
    }
  };

  function onSubmit(data: CourseFormValues) {
    try {
      const startTime24 = convertTo24HourFormat(data.startTime, data.ampm as AmPm);
      const newCourse: Course = {
        id: initialData?.id || uuidv4(),
        title: data.title,
        weekday: data.weekday as Weekday,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        startTime: startTime24,
        duration: parseFloat(data.duration),
        location: data.location || 'N/A',
        description: data.description || '',
        excludedDates: initialData?.excludedDates || [],
      };
      onSubmitCourse(newCourse, isEditMode);
    } catch (error) {
      if (error instanceof Error) {
        form.setError('startTime', { type: 'manual', message: error.message });
      } else {
        console.error("Error processing form: ", error);
        form.setError("root", { message: "An unexpected error occurred." });
      }
    }
  }

  const watchedStartDate = form.watch('startDate');
  const watchedEndDate = form.watch('endDate');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weekday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of the Week</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WEEKDAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem className="md:col-span-2 space-y-2">
          <FormLabel>Date Range</FormLabel>
          <Popover open={isDateRangePopoverOpen} onOpenChange={setIsDateRangePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !watchedStartDate && "text-muted-foreground" 
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Pick a date range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={watchedStartDate || new Date()}
                selected={{ from: watchedStartDate, to: watchedEndDate }}
                onSelect={(range: DateRange | undefined) => {
                  form.setValue('startDate', range?.from, { shouldValidate: true });
                  form.setValue('endDate', range?.to, { shouldValidate: true });
                  if (range?.from && range?.to) {
                     setIsDateRangePopoverOpen(false);
                  }
                }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pt-1">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Start Date</div>
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <div 
                    className={cn(
                      "p-2 border rounded-md min-h-[40px] text-sm cursor-pointer hover:border-primary", 
                      !watchedStartDate && "text-muted-foreground"
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsStartDatePickerOpen(true)}
                  >
                    {watchedStartDate ? format(watchedStartDate, "PPP") : "Not set"}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedStartDate}
                    onSelect={(date) => {
                      form.setValue('startDate', date, { shouldValidate: true });
                      setIsStartDatePickerOpen(false);
                    }}
                    defaultMonth={watchedStartDate || watchedEndDate || new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.startDate && <FormMessage>{form.formState.errors.startDate.message}</FormMessage>}
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">End Date</div>
               <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <div 
                    className={cn(
                      "p-2 border rounded-md min-h-[40px] text-sm cursor-pointer hover:border-primary", 
                      !watchedEndDate && "text-muted-foreground"
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEndDatePickerOpen(true)}
                  >
                    {watchedEndDate ? format(watchedEndDate, "PPP") : "Not set"}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedEndDate}
                    onSelect={(date) => {
                      form.setValue('endDate', date, { shouldValidate: true });
                      setIsEndDatePickerOpen(false);
                    }}
                    defaultMonth={watchedEndDate || watchedStartDate || new Date()}
                    initialFocus
                    disabled={(date) => watchedStartDate && date < watchedStartDate}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.endDate && <FormMessage>{form.formState.errors.endDate.message}</FormMessage>}
            </div>
          </div>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (12-hour)</FormLabel>
                <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="HH:MM"
                        {...field}
                        onBlur={(e) => {
                          handleStartTimeBlurLogic(e);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormField
                        control={form.control}
                        name="ampm"
                        render={({ field: ampmField }) => (
                        <FormItem className="shrink-0">
                            <Select onValueChange={ampmField.onChange} value={ampmField.value} defaultValue={ampmField.value}>
                            <FormControl>
                                <SelectTrigger className="w-[80px]">
                                <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {AM_PM_OPTIONS.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </FormItem>
                        )}
                    />
                </div>
                <FormMessage />
                {form.formState.errors.ampm && <FormMessage>{form.formState.errors.ampm.message}</FormMessage>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., DK A (DK Buildings)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lecturer (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full md:w-auto">
          {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditMode ? 'Update Course' : 'Add Course'}
        </Button>
      </form>
    </Form>
  );
}
