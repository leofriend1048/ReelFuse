"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const PRESET_RANGES = {
  "Today": () => ({ from: new Date(), to: new Date() }),
  "Yesterday": () => {
    const yesterday = addDays(new Date(), -1)
    return { from: yesterday, to: yesterday }
  },
  "Last 7 days": () => ({ from: addDays(new Date(), -6), to: new Date() }),
  "Last 30 days": () => ({ from: addDays(new Date(), -29), to: new Date() }),
}

export function DatePickerWithRangeAndPresets({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -6),
    to: new Date(),
  })
  const [selectedPreset, setSelectedPreset] = React.useState<String>("Last 7 days")

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col space-y-2 p-2" align="start">
        <Select
  onValueChange={(value) => {
    const presetKey = value as keyof typeof PRESET_RANGES;
    setDate(PRESET_RANGES[presetKey]());
    setSelectedPreset(value);
  }}
>
            <SelectTrigger>
              <span>{selectedPreset}</span>
            </SelectTrigger>
            <SelectContent position="popper">
            {Object.keys(PRESET_RANGES).map((key, index) => (
  <SelectItem key={index} value={key}>{key}</SelectItem>
))}
            </SelectContent>
          </Select>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate)
	      setSelectedPreset("Custom")
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}