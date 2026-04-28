import { Suspense } from "react";
import Link from "next/link";
import { CalendarCheck2, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "./_components/sign-in-form";
import { SignUpForm } from "./_components/sign-up-form";

const HIGHLIGHTS = [
  { icon: Users, title: "For patients", body: "Browse doctors and book a slot in seconds." },
  { icon: CalendarCheck2, title: "For doctors", body: "Publish availability and approve requests in one tap." },
  { icon: ShieldCheck, title: "Private by default", body: "Row-level security keeps your records yours." },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const defaultTab = tab === "signup" ? "signup" : "signin";

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-0 opacity-90"
          style={{
            background:
              "radial-gradient(1200px 600px at 0% 0%, oklch(0.65 0.2 262) 0%, transparent 60%), radial-gradient(900px 500px at 100% 100%, oklch(0.45 0.22 268) 0%, transparent 55%), linear-gradient(135deg, oklch(0.55 0.22 262), oklch(0.4 0.2 268))",
          }}
        />
        <div className="relative z-10 flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Stethoscope className="h-4 w-4" />
          </span>
          MediBook
        </div>

        <div className="relative z-10 max-w-sm space-y-6">
          <h1 className="text-balance font-heading text-4xl font-semibold leading-tight tracking-tight">
            Care that fits your schedule.
          </h1>
          <p className="text-base/relaxed text-white/80">
            A minimal hospital booking system — built for clarity, not clutter.
          </p>
          <ul className="space-y-3 pt-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-white/75">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} MediBook. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-foreground lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </span>
            MediBook
          </Link>

          <Card className="border bg-card shadow-sm">
            <CardHeader className="space-y-1.5 pb-2 text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to continue, or create an account.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue={defaultTab} className="!flex !w-full !flex-col gap-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <Suspense>
                    <SignInForm />
                  </Suspense>
                </TabsContent>
                <TabsContent value="signup">
                  <Suspense>
                    <SignUpForm />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our terms and privacy policy.
          </p>
        </div>
      </section>
    </div>
  );
}
