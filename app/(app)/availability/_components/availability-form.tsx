"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TimeSelect } from "./time-select";
import {
  createAvailabilitySlots,
  type AvailabilityState,
} from "@/app/actions/availability";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

function rangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Pick a date or range";
  if (!range.to || toIsoDate(range.from) === toIsoDate(range.to)) {
    return format(range.from, "PPP");
  }
  return `${format(range.from, "MMM d, yyyy")} → ${format(range.to, "MMM d, yyyy")}`;
}

export function AvailabilityForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const t = startOfToday();
    return { from: t, to: t };
  });
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AvailabilityState, FormData>(
    createAvailabilitySlots,
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(`Created ${state.created} slot${state.created === 1 ? "" : "s"}.`);
      formRef.current?.reset();
      const t = startOfToday();
      setRange({ from: t, to: t });
    } else {
      toast.error(state.error);
    }
  }, [state]);

  const fromIso = range?.from ? toIsoDate(range.from) : "";
  const toIso = range?.to
    ? toIsoDate(range.to)
    : range?.from
    ? toIsoDate(range.from)
    : "";
  const dayCount =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from) + 1
      : range?.from
      ? 1
      : 0;

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="date-trigger">Dates</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-trigger"
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !range?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{rangeLabel(range)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={setRange}
              disabled={(d) => d < startOfToday()}
              captionLayout="dropdown"
              className="rounded-lg border"
            />
            <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {dayCount > 0
                  ? `${dayCount} day${dayCount === 1 ? "" : "s"} selected`
                  : "Click a day, or drag to select a range"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={!range?.from}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <input type="hidden" name="from_date" value={fromIso} />
        <input type="hidden" name="to_date" value={toIso} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="start_time">Start</Label>
          <TimeSelect id="start_time" name="start_time" defaultValue="09:00" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="end_time">End</Label>
          <TimeSelect id="end_time" name="end_time" defaultValue="17:00" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="duration_minutes">Slot length</Label>
        <Select name="duration_minutes" defaultValue="30">
          <SelectTrigger id="duration_minutes" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="20">20 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending || dayCount === 0}>
        {pending
          ? "Adding…"
          : dayCount > 1
          ? `Add slots for ${dayCount} days`
          : "Add slots"}
      </Button>
    </form>
  );
}
