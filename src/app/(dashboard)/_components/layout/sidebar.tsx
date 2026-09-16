"use client";

import { UserMenu } from "@dashboard/_components/layout/user-menu";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import { buttonVariants } from "@src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@src/components/ui/sheet";
import {
  APPS,
  getSidebarNavForApp,
  resolveAppFromPathname,
  type AppNavLink,
} from "@src/lib/apps/registry";
import type { AuthContext } from "@src/lib/auth/session";
import {
  FANB_APP_SHELL_GRADIENT,
  INSTITUTION_SHORT_NAME,
} from "@src/lib/branding";
import { cn } from "@src/lib/utils";
import { LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  if (href === "/personal" || href === "/sistema" || href === "/inventario")
    return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkBase =
  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors";

export type SidebarUser = {
  name: string | null | undefined;
  email: string | null | undefined;
  roleLabel: string;
  auth?: AuthContext;
};

type SidebarProps = {
  user: SidebarUser;
};

function NavLinks({
  links,
  pathname,
  onNavLinkClick,
}: {
  links: AppNavLink[];
  pathname: string;
  onNavLinkClick?: () => void;
}) {
  const navProps = onNavLinkClick ? { onClick: onNavLinkClick } : {};

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              linkBase,
              active
                ? "bg-white/8 text-white shadow-[inset_2px_0_0_0_#d4af37]"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
            {...navProps}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function NavSectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2.5 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
      {children}
    </p>
  );
}

function SidebarBrand({ moduleTitle }: { moduleTitle: string }) {
  return (
    <div className="shrink-0">
      <FanbFlagStripe className="h-1" />
      <div className="flex items-center gap-2.5 border-b border-white/8 px-3 py-2.5">
        <CefoaCrest size="md" priority className="shrink-0 drop-shadow-none" />
        <div className="min-w-0">
          <p className="font-display text-[13px] font-semibold leading-none tracking-[0.18em] text-amber-100">
            {INSTITUTION_SHORT_NAME}
          </p>
          <h1 className="mt-1 truncate text-xs leading-tight text-slate-400">
            {moduleTitle}
          </h1>
        </div>
      </div>
    </div>
  );
}

function SidebarPanel({
  user,
  onNavLinkClick,
}: SidebarProps & { onNavLinkClick?: () => void }) {
  const pathname = usePathname() ?? "";
  const appContext = resolveAppFromPathname(pathname);
  const auth = user.auth!;
  const nav = useMemo(
    () => getSidebarNavForApp(appContext, auth),
    [appContext, auth],
  );
  const brandTitle =
    appContext === "hub" ? "Portal" : APPS[appContext].shortName;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarBrand moduleTitle={brandTitle} />
      <nav className="min-h-0 flex-1 basis-0 overflow-y-auto px-2 py-2">
        {appContext !== "hub" ? (
          <Link
            href="/"
            className={cn(linkBase, "mb-1 text-slate-400 hover:bg-white/5 hover:text-white")}
            {...(onNavLinkClick ? { onClick: onNavLinkClick } : {})}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            Portal
          </Link>
        ) : null}

        <div className="flex flex-col gap-px">
          {nav.hub ? (
            <NavLinks
              links={nav.hub}
              pathname={pathname}
              onNavLinkClick={onNavLinkClick}
            />
          ) : null}
          {nav.main.length > 0 ? (
            <>
              <NavSectionLabel>Módulo</NavSectionLabel>
              <NavLinks
                links={nav.main}
                pathname={pathname}
                onNavLinkClick={onNavLinkClick}
              />
            </>
          ) : null}
          {nav.config && nav.config.length > 0 ? (
            <>
              <NavSectionLabel>Más</NavSectionLabel>
              <NavLinks
                links={nav.config}
                pathname={pathname}
                onNavLinkClick={onNavLinkClick}
              />
            </>
          ) : null}
        </div>
      </nav>
      <div className="mt-auto shrink-0 border-t border-white/8">
        <UserMenu
          name={user.name}
          email={user.email}
          roleLabel={user.roleLabel}
        />
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const appContext = resolveAppFromPathname(pathname);
  const mobileTitle =
    appContext === "hub"
      ? "Portal"
      : appContext === "personal"
        ? APPS.personal.shortName
        : appContext === "inventario"
          ? APPS.inventario.shortName
          : APPS.sistema.shortName;

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
    "relative flex w-full shrink-0 flex-col border-b border-black text-slate-100 print:hidden md:sticky md:top-0 md:h-dvh md:max-h-dvh md:min-h-0 md:w-60 md:overflow-hidden md:border-b-0 md:border-r md:border-white/10",
  );

  return (
    <div className={shellClass}>
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <header className="flex h-12 items-center gap-2 border-b border-white/8 bg-black/40 px-2 pr-3">
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-8 shrink-0 text-slate-100 hover:bg-white/5 hover:text-amber-50",
              )}
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </SheetTrigger>
            <CefoaCrest size="sm" decorative className="shrink-0 drop-shadow-none" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-amber-200/90">
                {INSTITUTION_SHORT_NAME}
              </p>
              <p className="truncate text-xs text-slate-300">{mobileTitle}</p>
            </div>
            <p className="max-w-[36%] truncate text-right text-[11px] text-slate-400">
              {user.name ?? "Usuario"}
            </p>
          </header>
          <SheetContent
            side="left"
            showCloseButton
            className={cn(
              FANB_APP_SHELL_GRADIENT,
              "flex w-[min(100vw,16.5rem)] max-w-[min(100vw,16.5rem)] flex-col gap-0 border-black p-0 text-slate-100",
              "h-dvh max-h-dvh min-h-0 overflow-hidden sm:max-w-xs",
              "[&>button]:text-slate-200 [&>button]:hover:bg-white/10 [&>button]:hover:text-amber-50",
            )}
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarPanel
                user={user}
                onNavLinkClick={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden h-full min-h-0 flex-1 flex-col md:flex">
        <SidebarPanel user={user} />
      </aside>
    </div>
  );
}
