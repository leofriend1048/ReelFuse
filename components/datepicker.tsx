"use client"

import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover } from './ui/popover';
import { PopoverTrigger } from './ui/popover';
import { PopoverContent } from './ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DayClickEventHandler } from 'react-day-picker';

interface DatePickerProps {
  onSelectDate: (date: Date) => void;
}

export function DatePicker({ onSelectDate }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>();

  // Change the type of handleSelectDate
  const handleSelectDate: DayClickEventHandler = (day, { selected }) => {
    if (selected) {
      // Deselect the day if it's already selected
      setDate(undefined);
    } else {
      // Select the day if it's not selected
      setDate(day);
      onSelectDate(day);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-[280px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {/* Use onDayClick instead of onSelect */}
        <Calendar mode="single" selected={date} onDayClick={handleSelectDate} initialFocus />
      </PopoverContent>
    </Popover>
  );
}