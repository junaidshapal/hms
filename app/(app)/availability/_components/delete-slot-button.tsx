"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteAvailabilitySlot } from "@/app/actions/availability";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DeleteSlotButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Delete slot"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const fd = new FormData();
              fd.set("id", id);
              await deleteAvailabilitySlot(fd);
              toast.success("Slot removed.");
            });
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Delete slot</TooltipContent>
    </Tooltip>
  );
}
