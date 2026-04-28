"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment } from "@/app/actions/appointments";

export function BookSlotButton({
  slotId,
  label,
  doctorName,
  when,
}: {
  slotId: string;
  label: string;
  doctorName: string;
  when: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await bookAppointment(undefined, formData);
      if (result?.ok) {
        toast.success("Appointment requested. Awaiting confirmation.");
        setOpen(false);
      } else if (result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-3 text-sm font-medium tabular-nums transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Request appointment
          </DialogTitle>
          <DialogDescription>
            With <strong>Dr. {doctorName}</strong> on {when}.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-4">
          <input type="hidden" name="availability_id" value={slotId} />
          <div className="grid gap-1.5">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Brief description of your visit…"
              rows={3}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Request appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
