"use client";

import { signOut } from "next-auth/react";
import { Button } from "@src/components/ui/button";

type UserMenuProps = {
  name: string | null | undefined;
  email: string | null | undefined;
  roleLabel: string;
};

export function UserMenu({ name, email, roleLabel }: UserMenuProps) {
  return (
    <div className="px-3 py-2.5">
      <p className="truncate text-[13px] font-medium leading-tight text-amber-50">
        {name ?? "Usuario"}
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">
        {email}
      </p>
      <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-amber-500/80">
        {roleLabel}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-2 h-7 w-full border border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
