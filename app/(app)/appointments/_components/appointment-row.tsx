"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Stethoscope,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatRange } from "@/lib/format";
import { DoctorAppointmentActions } from "./doctor-actions";

type AppointmentStatus = "pending" | "accepted" | "rejected";

export type AppointmentRowData = {
  id: string;
  status: AppointmentStatus;
  reason: string | null;
  created_at: string;
  doctorName: string | null;
  doctorSpecialization: string | null;
  patientName: string | null;
  slotDate: string | null;
  slotStart: string | null;
  slotEnd: string | null;
};

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppointmentRow({
  data,
  isDoctor,
  showActions,
}: {
  data: AppointmentRowData;
  isDoctor: boolean;
  showActions: boolean;
}) {
  const [open, setOpen] = useState(false);

  const counterpartName = isDoctor ? data.patientName : data.doctorName;
  const counterpartLabel = isDoctor
    ? data.patientName ?? "—"
    : data.doctorName
    ? `Dr. ${data.doctorName}`
    : "—";

  return (
    <>
      <TableRow
        onClick={() => setOpen(true)}
        className="cursor-pointer transition-colors hover:bg-muted/40"
      >
        <TableCell className="font-medium">
          {counterpartLabel}
          {!isDoctor && data.doctorSpecialization && (
            <p className="text-xs text-muted-foreground">{data.doctorSpecialization}</p>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap text-sm">
          {data.slotDate ? (
            <>
              <div>{formatDate(data.slotDate)}</div>
              {data.slotStart && data.slotEnd && (
                <div className="text-xs text-muted-foreground">
                  {formatRange(data.slotStart, data.slotEnd)}
                </div>
              )}
            </>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground sm:table-cell">
          {data.reason ?? <span className="italic">none</span>}
        </TableCell>
        <TableCell>
          <StatusBadge status={data.status} />
        </TableCell>
        {showActions && (
          <TableCell
            className="text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <DoctorAppointmentActions id={data.id} />
          </TableCell>
        )}
      </TableRow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Appointment details</DialogTitle>
              <StatusBadge status={data.status} />
            </div>
            <DialogDescription>
              {isDoctor
                ? "Details for the patient who booked this slot."
                : "Details for the doctor and time you requested."}
            </DialogDescription>
          </DialogHeader>

          {/* Counterpart card */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials(counterpartName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {isDoctor ? "Patient" : "Doctor"}
                </p>
                <p className="truncate text-base font-semibold">{counterpartLabel}</p>
                {!isDoctor && data.doctorSpecialization && (
                  <Badge variant="secondary" className="mt-1 capitalize">
                    <Stethoscope className="mr-1 h-3 w-3" />
                    {data.doctorSpecialization}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* When */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Date
              </div>
              <p className="mt-1 text-sm font-medium">
                {data.slotDate ? formatDate(data.slotDate) : "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Time
              </div>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {data.slotStart && data.slotEnd
                  ? formatRange(data.slotStart, data.slotEnd)
                  : "—"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Reason
            </div>
            <p className="mt-1 text-sm">
              {data.reason ?? <span className="italic text-muted-foreground">No reason provided.</span>}
            </p>
          </div>

          <Separator />

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            Requested {new Date(data.created_at).toLocaleString()}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
