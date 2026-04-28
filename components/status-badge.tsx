import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200",
  accepted: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-900 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-200",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize border-transparent", STYLES[status])}>
      {status}
    </Badge>
  );
}
