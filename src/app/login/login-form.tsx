"use client";

import { signIn } from "next-auth/react";
import {
  AlertCircle,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FANB_INSTITUTION_PANEL } from "@/lib/branding";
import { cn } from "@/lib/utils";

function InputWithIcon({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-amber-600/75"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = document.getElementById("login-form") as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (res?.error) {
      setError("Credenciales incorrectas o usuario inactivo.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const fieldClass =
      "h-9 border-emerald-900/45 pl-9 text-sm text-slate-950 placeholder:text-slate-500 focus-visible:border-amber-600/55 focus-visible:ring-amber-500/25";

  return (
    <Card
      size="sm"
      className={cn(
        FANB_INSTITUTION_PANEL,
        "w-full max-w-sm shadow-2xl shadow-black/45 sm:max-w-104",
      )}
    >
      <CardHeader className="border-b border-amber-900/25 bg-black/15 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-800/40 bg-emerald-950/80 text-amber-200 shadow-inner"
            aria-hidden
          >
            <UserRound className="size-4.5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle className="text-base font-semibold tracking-tight text-slate-950">
              Acceso al sistema
            </CardTitle>
            <CardDescription className="text-xs leading-snug text-emerald-950/70">
              Ingrese credenciales institucionales.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-3">
        <form id="login-form" onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-emerald-950/75">
              Correo
            </Label>
            <InputWithIcon icon={Mail}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="usuario@correo.mil"
                className={fieldClass}
              />
            </InputWithIcon>
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-medium text-emerald-950/75">
              Contraseña
            </Label>
            <InputWithIcon icon={Lock}>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className={fieldClass}
              />
            </InputWithIcon>
          </div>
          {error ? (
            <div
              role="alert"
              className="flex gap-2 rounded-md border items-center border-red-500/35 bg-red-950/15 px-2.5 py-2 text-xs text-red-950"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden />
              <p>{error}</p>
            </div>
          ) : null}
          <Button
            type="submit"
            className="mt-1 h-10 w-full gap-2 border border-slate-700/70 bg-linear-to-b from-slate-800 to-slate-700 text-sm font-semibold text-white shadow-md shadow-black/30 hover:from-slate-700 hover:to-slate-600"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Entrando…
              </>
            ) : (
              <>
                <LogIn className="size-4" aria-hidden />
                Entrar
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[0.65rem] leading-tight text-slate-950/90">
            <Shield className="size-3.5 shrink-0 text-slate-950/70" aria-hidden />
            Conexión segura · acceso restringido
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
