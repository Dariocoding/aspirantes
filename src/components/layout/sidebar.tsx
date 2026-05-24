"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  FileSearch,
  Home,
  Medal,
  Menu,
  Shield,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FanbFlagStripe } from "@/components/institution/fanb-flag-stripe";
import { FANB_APP_SHELL_GRADIENT, INSTITUTION_LOGO_SRC } from "@/lib/branding";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkBase =
  "flex items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium transition-colors";

const mainLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/aspirantes", label: "Censo de Aspirantes", icon: Users },
  { href: "/manual", label: "Manual de usuario", icon: BookOpen },
] as const;

const configLinksBase = [
  { href: "/efemerides", label: "Efemérides", icon: CalendarDays },
  { href: "/esquelas", label: "Esquelas", icon: Medal },
] as const;

export type SidebarUser = {
  name: string | null | undefined;
  email: string | null | undefined;
  role: UserRole;
};

type SidebarProps = {
  isAdmin: boolean;
  user: SidebarUser;
};

function SidebarPanel({
  isAdmin,
  user,
  onNavLinkClick,
}: SidebarProps & { onNavLinkClick?: () => void }) {
  const pathname = usePathname() ?? "";
  const navProps = onNavLinkClick ? { onClick: onNavLinkClick } : {};

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FanbFlagStripe />
      <div className="shrink-0 border-b border-amber-900/20 bg-gradient-to-b from-black/25 to-transparent px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center md:justify-start">
            <Image
              src={INSTITUTION_LOGO_SRC}
              alt="Fuerza Armada Nacional Bolivariana"
              width={280}
              height={72}
              className="h-16 w-auto max-w-full object-contain object-center drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-[4.25rem] md:h-[4.75rem]"
              priority
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-amber-200/90">
              Fuerza Armada Nacional Bolivariana
            </p>
            <h1 className="mt-2 font-serif text-lg font-semibold tracking-wide text-white sm:text-xl">
              Gestión de personal
            </h1>
            <p className="mt-1.5 text-xs leading-snug text-emerald-100/65">
              Sistema de censo y administración de aspirantes al Ejército Bolivariano
            </p>
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 basis-0 overflow-y-auto px-3 py-3 pb-2 md:pb-3">
        <div className="flex flex-col gap-0.5">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  linkBase,
                  active
                    ? "border-amber-500/95 bg-amber-950/25 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-slate-200/95 hover:border-emerald-800/70 hover:bg-emerald-950/40 hover:text-white",
                )}
                {...navProps}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 w-full md:mt-6">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/55">
            Configuración
          </p>
          <div className="flex flex-col gap-0.5">
            {configLinksBase.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    linkBase,
                    active
                      ? "border-amber-500/95 bg-amber-950/25 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-200/95 hover:border-emerald-800/70 hover:bg-emerald-950/40 hover:text-white",
                  )}
                  {...navProps}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <>
                <Link
                  href="/convocatorias"
                  className={cn(
                    linkBase,
                    isActivePath(pathname, "/convocatorias")
                      ? "border-amber-500/95 bg-amber-950/25 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-200/95 hover:border-emerald-800/70 hover:bg-emerald-950/40 hover:text-white",
                  )}
                  {...navProps}
                >
                  <BookMarked className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Convocatorias
                </Link>
                <Link
                  href="/usuarios"
                  className={cn(
                    linkBase,
                    isActivePath(pathname, "/usuarios")
                      ? "border-amber-500/95 bg-amber-950/25 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-200/95 hover:border-emerald-800/70 hover:bg-emerald-950/40 hover:text-white",
                  )}
                  {...navProps}
                >
                  <Shield className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Usuarios
                </Link>
                <Link
                  href="/auditoria"
                  className={cn(
                    linkBase,
                    isActivePath(pathname, "/auditoria")
                      ? "border-amber-500/95 bg-amber-950/25 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-200/95 hover:border-emerald-800/70 hover:bg-emerald-950/40 hover:text-white",
                  )}
                  {...navProps}
                >
                  <FileSearch className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  Auditoría
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>
      <div className="mt-auto shrink-0 border-t border-emerald-950/80 bg-black/15">
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </div>
  );
}

export function Sidebar({ isAdmin, user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const shellClass = cn(
    FANB_APP_SHELL_GRADIENT,
    "relative flex w-full shrink-0 flex-col border-b border-emerald-950/90 text-slate-100 shadow-[inset_-1px_0_0_rgba(255,207,0,0.06)] print:hidden md:sticky md:top-0 md:h-dvh md:max-h-dvh md:min-h-0 md:w-[19rem] md:overflow-hidden md:border-b-0 md:border-r md:border-emerald-950/80",
  );

  return (
    <div className={shellClass}>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-amber-600/15 to-transparent md:block" aria-hidden />

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <header className="flex h-[3.25rem] items-center gap-2 border-b border-emerald-950/80 bg-black/20 px-2 pr-3">
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0 text-slate-100 hover:bg-emerald-950/60 hover:text-amber-50",
              )}
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </SheetTrigger>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-amber-900/30 bg-black/30 p-0.5 shadow-inner">
              <Image
                src={INSTITUTION_LOGO_SRC}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-amber-200/85">
                FANB
              </p>
              <p className="truncate text-xs font-semibold text-white">Gestión de personal</p>
            </div>
            <div className="min-w-0 max-w-[38%] shrink-0 text-right">
              <p className="truncate text-xs font-medium text-slate-200">{user.name ?? "Usuario"}</p>
              <p className="truncate text-[9px] uppercase tracking-wide text-emerald-300/50">{user.role}</p>
            </div>
          </header>
          <SheetContent
            side="left"
            showCloseButton
            className={cn(
              FANB_APP_SHELL_GRADIENT,
              "flex w-[min(100vw,20rem)] max-w-[min(100vw,20rem)] flex-col gap-0 border-emerald-950 p-0 text-slate-100",
              "h-dvh max-h-dvh min-h-0 overflow-hidden sm:max-w-xs",
              "[&>button]:text-slate-200 [&>button]:hover:bg-emerald-950/70 [&>button]:hover:text-amber-50",
            )}
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarPanel isAdmin={isAdmin} user={user} onNavLinkClick={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden h-full min-h-0 flex-1 flex-col md:flex">
        <SidebarPanel isAdmin={isAdmin} user={user} />
      </aside>
    </div>
  );
}
