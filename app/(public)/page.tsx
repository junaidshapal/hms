import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Find a doctor",
    body: "Browse profiles by specialization with bios and experience at a glance.",
  },
  {
    icon: CalendarCheck,
    title: "Pick a slot",
    body: "See real-time availability and request the time that suits you best.",
  },
  {
    icon: ClipboardList,
    title: "Track requests",
    body: "Pending, accepted, and rejected appointments in one tidy view.",
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative">
      {/* Soft blue background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 400px at 50% -10%, oklch(0.92 0.07 255) 0%, transparent 60%)",
        }}
      />

      <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:pt-24">
        <h1 className="mt-5 font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Care that fits <span className="text-primary">your schedule</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Browse doctors, pick a time that works, and let your provider confirm — all in one place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login?tab=signup">
            <Button size="lg" className="h-11 px-6 text-sm">
              Get started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-11 px-6 text-sm">
              I already have an account
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Secured with row-level access controls
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="border-muted-foreground/10 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
