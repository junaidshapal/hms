"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signUp, type AuthState } from "@/app/actions/auth";

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  useEffect(() => {
    if (state && "ok" in state && state.ok === false) {
      toast.error(state.error);
    }
  }, [state]);

  const fieldErr = (name: string) =>
    state && "fields" in state ? state.fields?.[name]?.[0] : undefined;

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input id="signup-name" name="name" placeholder="Jane Doe" required className="h-10" />
        {fieldErr("name") && <p className="text-xs text-destructive">{fieldErr("name")}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="h-10"
        />
        {fieldErr("email") && <p className="text-xs text-destructive">{fieldErr("email")}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className="h-10"
        />
        {fieldErr("password") && (
          <p className="text-xs text-destructive">{fieldErr("password")}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-role">I am a…</Label>
        <Select
          name="role"
          defaultValue="patient"
          onValueChange={(v) => setRole(v as "patient" | "doctor")}
        >
          <SelectTrigger id="signup-role" className="h-10">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {role === "doctor" && (
        <div className="grid gap-2">
          <Label htmlFor="signup-specialization">Specialization</Label>
          <Input
            id="signup-specialization"
            name="specialization"
            placeholder="e.g. Cardiology"
            required
            className="h-10"
          />
          {fieldErr("specialization") && (
            <p className="text-xs text-destructive">{fieldErr("specialization")}</p>
          )}
        </div>
      )}
      <Button type="submit" disabled={pending} size="lg" className="mt-1 h-10 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
