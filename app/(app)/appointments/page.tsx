import { ClipboardList } from "lucide-react";
import { requireProfile, getDoctorRecord } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { AppointmentRow, type AppointmentRowData } from "./_components/appointment-row";

type AppointmentStatus = "pending" | "accepted" | "rejected";

type RawRow = {
  id: string;
  status: AppointmentStatus;
  reason: string | null;
  created_at: string;
  doctor: { id: string; specialization: string; profile: { name: string } | { name: string }[] | null } | null;
  patient: { name: string } | { name: string }[] | null;
  slot: { date: string; start_time: string; end_time: string } | { date: string; start_time: string; end_time: string }[] | null;
};

function flatten(r: RawRow): AppointmentRowData {
  const doctor = Array.isArray(r.doctor) ? r.doctor[0] : r.doctor;
  const doctorProfile = doctor && (Array.isArray(doctor.profile) ? doctor.profile[0] : doctor.profile);
  const patient = Array.isArray(r.patient) ? r.patient[0] : r.patient;
  const slot = Array.isArray(r.slot) ? r.slot[0] : r.slot;
  return {
    id: r.id,
    status: r.status,
    reason: r.reason,
    created_at: r.created_at,
    doctorName: doctorProfile?.name ?? null,
    doctorSpecialization: doctor?.specialization ?? null,
    patientName: patient?.name ?? null,
    slotDate: slot?.date ?? null,
    slotStart: slot?.start_time ?? null,
    slotEnd: slot?.end_time ?? null,
  };
}

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
  return ((data ?? []) as unknown as RawRow[]).map(flatten);
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
            ? "Review requests and confirm visits. Click any row for details."
            : "Track all your booking requests. Click any row for details."}
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
  rows: AppointmentRowData[];
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

  const showActions = isDoctor && status === "pending";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isDoctor ? "Patient" : "Doctor"}</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="hidden sm:table-cell">Reason</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <AppointmentRow
              key={r.id}
              data={r}
              isDoctor={isDoctor}
              showActions={showActions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
