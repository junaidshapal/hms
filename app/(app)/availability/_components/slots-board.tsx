"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  Coffee,
  ListChecks,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { CalendarClock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate, formatRange } from "@/lib/format";
import {
  deleteAvailabilitySlot,
  deleteAvailabilitySlots,
} from "@/app/actions/availability";

export type SlotsBoardSlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  slot_type: "regular" | "break";
};

const isOpen = (s: SlotsBoardSlot) => s.slot_type === "regular" && !s.is_booked;

export function SlotsBoard({ days }: { days: Array<[string, SlotsBoardSlot[]]> }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allOpenIds = useMemo(
    () => days.flatMap(([, slots]) => slots.filter(isOpen).map((s) => s.id)),
    [days],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDay(slots: SlotsBoardSlot[]) {
    const openInDay = slots.filter(isOpen).map((s) => s.id);
    const allSelected = openInDay.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) openInDay.forEach((id) => next.delete(id));
      else openInDay.forEach((id) => next.add(id));
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allOpenIds));
  }

  function clear() {
    setSelected(new Set());
  }

  function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await deleteAvailabilitySlots(ids);
      if (res?.ok) {
        toast.success(`Removed ${res.deleted} slot${res.deleted === 1 ? "" : "s"}.`);
        setSelected(new Set());
      } else if (res) {
        toast.error(res.error);
      }
    });
  }

  function deleteOne(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteAvailabilitySlot(fd);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Slot removed.");
    });
  }

  if (days.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={CalendarClock}
            title="No slots yet"
            description="Use the form on the left to add your first availability window."
          />
        </CardContent>
      </Card>
    );
  }

  const selectionCount = selected.size;
  const hasSelection = selectionCount > 0;

  return (
    <div className="space-y-4">
      {/* Sticky selection toolbar */}
      <div
        className={cn(
          "sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/90 px-3 py-2 shadow-sm backdrop-blur transition-all",
          hasSelection ? "border-primary/40 bg-primary/5" : "border-dashed",
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <ListChecks
            className={cn(
              "h-4 w-4",
              hasSelection ? "text-primary" : "text-muted-foreground",
            )}
          />
          {hasSelection ? (
            <span className="font-medium">
              {selectionCount} slot{selectionCount === 1 ? "" : "s"} selected
            </span>
          ) : (
            <span className="text-muted-foreground">
              Click an open slot to select it. Booked slots can&apos;t be removed.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              disabled={pending}
            >
              <XIcon className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={selectAll}
            disabled={pending || allOpenIds.length === 0}
          >
            Select all open
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={deleteSelected}
            disabled={!hasSelection || pending}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
            {hasSelection ? ` (${selectionCount})` : ""}
          </Button>
        </div>
      </div>

      {days.map(([date, daySlots]) => {
        const dayOpen = daySlots.filter(isOpen).length;
        const dayBooked = daySlots.filter(
          (s) => s.slot_type === "regular" && s.is_booked,
        ).length;
        const dayBreaks = daySlots.filter((s) => s.slot_type === "break").length;
        const dayOpenIds = daySlots.filter(isOpen).map((s) => s.id);
        const allDaySelected =
          dayOpenIds.length > 0 && dayOpenIds.every((id) => selected.has(id));

        return (
          <Card key={date} className="overflow-hidden">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">{formatDate(date)}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-current text-primary" />
                    {dayOpen} open
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    {dayBooked} booked
                  </span>
                  {dayBreaks > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Coffee className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      {dayBreaks} break{dayBreaks === 1 ? "" : "s"}
                    </span>
                  )}
                  {dayOpen > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleDay(daySlots)}
                      className="font-medium text-primary hover:underline"
                    >
                      {allDaySelected ? "Deselect" : "Select all"}
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((s) => (
                  <SlotChip
                    key={s.id}
                    slot={s}
                    selected={selected.has(s.id)}
                    onToggle={toggle}
                    onDelete={deleteOne}
                    pending={pending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SlotChip({
  slot,
  selected,
  onToggle,
  onDelete,
  pending,
}: {
  slot: SlotsBoardSlot;
  selected: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  if (slot.slot_type === "break") {
    return (
      <div className="group relative flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex min-w-0 items-center gap-2">
          <Coffee className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="whitespace-nowrap font-medium text-amber-900 dark:text-amber-200">
            Break{" "}
            <span className="font-normal tabular-nums">
              {formatRange(slot.start_time, slot.end_time)}
            </span>
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Remove break"
              disabled={pending}
              onClick={() => onDelete(slot.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-amber-700/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50 dark:text-amber-300/60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Remove break</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (slot.is_booked) {
    return (
      <div className="group relative flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex min-w-0 items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="whitespace-nowrap font-medium tabular-nums text-emerald-900 dark:text-emerald-200">
            {formatRange(slot.start_time, slot.end_time)}
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Booked
        </span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(slot.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(slot.id);
        }
      }}
      className={cn(
        "group relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {selected ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <Circle className="h-2 w-2 shrink-0 fill-current text-primary" />
        )}
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatRange(slot.start_time, slot.end_time)}
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Delete slot"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slot.id);
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Delete slot</TooltipContent>
      </Tooltip>
    </div>
  );
}
