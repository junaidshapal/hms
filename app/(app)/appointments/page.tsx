import { ClipboardList } from "lucide-react";
import { requireProfile, getDoctorRecord } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatRange } from "@/lib/format";
import { DoctorAppointmentActions } from "./_components/doctor-actions";

type AppointmentStatus = "pending" | "accepted" | "rejected";

type Row = {
  id: string;
  status: AppointmentStatus;
  reason: string | null;
  created_at: string;
  doctor: { id: string; specialization: string; profile: { name: string } | null } | null;
  patient: { name: string } | null;
  slot: { date: string; start_time: string; end_time: string } | null;
};

async function loadRows(opts: {
  isDoctor: boolean;
  doctorId?: string;
  patientId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      `
        id,
        status,
        reason,
        created_at,
        doctor:doctors(id, specialization, profile:profiles(name)),
        patient:profiles!appointments_patient_id_fkey(name),
        slot:availability(date, start_time, end_time)
      `,
    )
    .order("created_at", { ascending: false });

  if (opts.isDoctor && opts.doctorId) {
    query = query.eq("doctor_id", opts.doctorId);
  } else if (!opts.isDoctor && opts.patientId) {
    query = query.eq("patient_id", opts.patientId);
  }

  const { data = [] } = await query;
  return (data ?? []) as unknown as Row[];
}

export default async function AppointmentsPage() {
  const profile = await requireProfile();
  const isDoctor = profile.role === "doctor";
  const doctor = isDoctor ? await getDoctorRecord(profile.id) : null;

  const rows = await loadRows({
    isDoctor,
    doctorId: doctor?.id,
    patientId: profile.id,
  });

  const byStatus = {
    pending: rows.filter((r) => r.status === "pending"),
    accepted: rows.filter((r) => r.status === "accepted"),
    rejected: rows.filter((r) => r.status === "rejected"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header>
        <p className="text-sm text-muted-foreground">{isDoctor ? "Doctor" : "Patient"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDoctor
            ? "Review requests and confirm visits."
            : "Track all your booking requests."}
        </p>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All appointments</CardTitle>
          <CardDescription>
            {rows.length} total · {byStatus.pending.length} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({byStatus.pending.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({byStatus.accepted.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({byStatus.rejected.length})</TabsTrigger>
            </TabsList>

            {(["pending", "accepted", "rejected"] as const).map((status) => (
              <TabsContent key={status} value={status} className="pt-4">
                <AppointmentTable rows={byStatus[status]} isDoctor={isDoctor} status={status} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AppointmentTable({
  rows,
  isDoctor,
  status,
}: {
  rows: Row[];
  isDoctor: boolean;
  status: AppointmentStatus;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={`No ${status} appointments`}
        description={
          isDoctor
            ? `You don't have any ${status} requests right now.`
            : `You don't have any ${status} appointments yet.`
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isDoctor ? "Patient" : "Doctor"}</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="hidden sm:table-cell">Reason</TableHead>
            <TableHead>Status</TableHead>
            {isDoctor && status === "pending" && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                {isDoctor
                  ? r.patient?.name ?? "—"
                  : r.doctor?.profile?.name
                  ? `Dr. ${r.doctor.profile.name}`
                  : "—"}
                {!isDoctor && r.doctor?.specialization && (
                  <p className="text-xs text-muted-foreground">{r.doctor.specialization}</p>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {r.slot ? (
                  <>
                    <div>{formatDate(r.slot.date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRange(r.slot.start_time, r.slot.end_time)}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground sm:table-cell">
                {r.reason ?? <span className="italic">none</span>}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              {isDoctor && status === "pending" && (
                <TableCell className="text-right">
                  <DoctorAppointmentActions id={r.id} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
