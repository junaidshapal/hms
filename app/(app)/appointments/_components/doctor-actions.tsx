"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  acceptAppointment,
  rejectAppointment,
} from "@/app/actions/appointments";

export function DoctorAppointmentActions({ id }: { id: string }) {
  const [pending, start] = useTransition();

  function run(label: string, fn: (fd: FormData) => Promise<unknown>) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      try {
        await fn(fd);
        toast.success(label);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="inline-flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("Appointment rejected.", rejectAppointment)}
      >
        Reject
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run("Appointment accepted.", acceptAppointment)}
      >
        Accept
      </Button>
    </div>
  );
}
