"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthState } from "@/app/actions/auth";

export function SignInForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);

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
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
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
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10"
        />
        {fieldErr("password") && (
          <p className="text-xs text-destructive">{fieldErr("password")}</p>
        )}
      </div>
      <Button type="submit" disabled={pending} size="lg" className="mt-1 h-10 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
