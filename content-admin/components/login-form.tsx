"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_STATE: LoginState = {};

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-xs text-muted-foreground">
          Lösenord
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Lägg till <code>VIVACI_ADMIN_PASSWORD</code> och{" "}
          <code>VIVACI_ADMIN_SESSION_SECRET</code> i <code>.env.local</code> och starta om appen.
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending || !configured}>
        <LogIn data-icon="inline-start" />
        {pending ? "Loggar in…" : "Logga in"}
      </Button>
    </form>
  );
}
