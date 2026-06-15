"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";
import { createUsuario } from "@src/app/actions/usuarios";
import type { UsuarioActionState } from "@src/lib/action-types";
import { usuarioInitialActionState } from "@src/lib/action-types";
import type { AuthRoleSummary } from "@src/lib/auth/rbac";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="font-medium">{k}:</span> {v}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  onDone?: () => void;
  assignableRoles: AuthRoleSummary[];
};

function defaultAssignableRoleId(assignableRoles: AuthRoleSummary[]): string {
  const operador = assignableRoles.find((r) => r.key === "OPERADOR");
  return operador?.id ?? assignableRoles[0]?.id ?? "";
}

export function UsuarioCreateForm({ onDone, assignableRoles }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<UsuarioActionState, FormData>(
    createUsuario,
    usuarioInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
        onDone?.();
      }
    },
    [router, onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title="Usuario creado"
        description="La cuenta quedó registrada. Ya puede compartir las credenciales iniciales de forma segura."
      />
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <ErrorList errors={state.errors} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="usuario-create-email">Correo</Label>
          <Input
            id="usuario-create-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            placeholder="correo@institución.gob.ve"
            className="shadow-xs"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="usuario-create-name">Nombre completo</Label>
          <Input id="usuario-create-name" name="name" required autoComplete="off" className="shadow-xs" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="usuario-create-password">Contraseña inicial</Label>
          <Input
            id="usuario-create-password"
            name="password"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
            placeholder="Mín. 10 caracteres, letra y dígito"
            className="shadow-xs"
          />
          <p className="text-[0.65rem] leading-snug text-slate-500">Debe incluir al menos una letra y un número.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="usuario-create-role">Rol</Label>
          <select
            id="usuario-create-role"
            name="roleId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            defaultValue={defaultAssignableRoleId(assignableRoles)}
          >
            {assignableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Crear usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
