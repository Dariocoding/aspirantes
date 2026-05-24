"use client";

import { signOut } from "next-auth/react";
import type { UserRole } from "@/generated/prisma";
import { userRoleLabel } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  name: string | null | undefined;
  email: string | null | undefined;
  role: UserRole;
};

export function UserMenu({ name, email, role }: UserMenuProps) {
  return (
    <div className="px-4 py-4 text-sm text-slate-200">
      <p className="font-medium text-amber-50/95">{name ?? "Usuario"}</p>
      <p className="truncate text-xs text-emerald-200/45">{email}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-600/80">
        {userRoleLabel(role)}
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3 w-full border border-amber-900/40 bg-slate-900/80 text-slate-100 hover:bg-emerald-950/80 hover:text-amber-50"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
