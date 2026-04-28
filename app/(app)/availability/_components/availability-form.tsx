"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Coffee, Plus, X } from "lucide-react";
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

type Break = { start: string; end: string };

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

export function AvailabilityForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(() => startOfToday());
  const [open, setOpen] = useState(false);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [state, action, pending] = useActionState<AvailabilityState, FormData>(
    createAvailabilitySlots,
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(`Created ${state.created} slot${state.created === 1 ? "" : "s"}.`);
      formRef.current?.reset();
      setDate(startOfToday());
      setBreaks([]);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  function addBreak() {
    setBreaks((b) => [...b, { start: "12:00", end: "13:00" }]);
  }
  function removeBreak(idx: number) {
    setBreaks((b) => b.filter((_, i) => i !== idx));
  }
  function updateBreak(idx: number, key: keyof Break, value: string) {
    setBreaks((b) => b.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  }

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="date-trigger">Date</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-trigger"
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  setOpen(false);
                }
              }}
              disabled={(d) => d < startOfToday()}
              captionLayout="dropdown"
              className="rounded-lg border"
            />
          </PopoverContent>
        </Popover>
        <input type="hidden" name="date" value={date ? toIsoDate(date) : ""} />
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

      {/* Breaks */}
      <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-sm">
            <Coffee className="h-3.5 w-3.5" />
            Breaks
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBreak}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add break
          </Button>
        </div>

        {breaks.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No breaks. Add one to skip a time window (e.g., lunch 12–1 PM).
          </p>
        ) : (
          <div className="grid gap-2">
            {breaks.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <TimeSelect
                    name={`break_start_${idx}`}
                    defaultValue={b.start}
                    onValueChange={(v) => updateBreak(idx, "start", v)}
                  />
                </div>
                <span className="text-xs text-muted-foreground">to</span>
                <div className="flex-1">
                  <TimeSelect
                    name={`break_end_${idx}`}
                    defaultValue={b.end}
                    onValueChange={(v) => updateBreak(idx, "end", v)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBreak(idx)}
                  aria-label="Remove break"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="breaks" value={JSON.stringify(breaks)} />
      </div>

      <Button type="submit" disabled={pending || !date}>
        {pending ? "Adding…" : "Add slots"}
      </Button>
    </form>
  );
}
