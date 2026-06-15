import Link from "next/link";
import { auth } from "@src/auth";
import { ChevronRight, FileSearch, KeyRound, Users } from "lucide-react";
import { SistemaStats } from "@dashboard/sistema/_components/sistema-stats";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { Permission, hasPermission } from "@src/lib/auth/permissions";
import { getSistemaAuditStats, getSistemaUserStats } from "@src/lib/sistema/stats";
import { routes } from "@src/lib/apps/routes";
import { cn } from "@src/lib/utils";
import { unauthorized } from "next/navigation";

type ModuleLink = {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
};

const moduleLinkClass =
  "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400";

export default async function SistemaDashboardPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  const canUsers = hasPermission(ctx, Permission.USERS_READ);
  const canAudit = hasPermission(ctx, Permission.AUDIT_READ);
  const canRoles = hasPermission(ctx, Permission.ROLES_READ);

  const [userStats, auditStats] = await Promise.all([
    canUsers ? getSistemaUserStats() : null,
    canAudit ? getSistemaAuditStats() : null,
  ]);

  const modules: ModuleLink[] = [
    ...(canUsers
      ? [
          {
            href: routes.sistema.usuarios,
            title: "Usuarios",
            description: "Cuentas, roles y estado de acceso",
            icon: Users,
          },
        ]
      : []),
    ...(canRoles
      ? [
          {
            href: routes.sistema.roles,
            title: "Roles y permisos",
            description: "Módulos y permisos por rol",
            icon: KeyRound,
          },
        ]
      : []),
    ...(canAudit
      ? [
          {
            href: routes.sistema.auditoria,
            title: "Auditoría",
            description: "Registro de operaciones del sistema",
            icon: FileSearch,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Administración del sistema</h1>
        <p className="mt-1 text-sm text-slate-600">Gestión de accesos y trazabilidad.</p>
      </header>

      {userStats || auditStats ? (
        <SistemaStats userStats={userStats ?? undefined} auditStats={auditStats ?? undefined} />
      ) : null}

      {modules.length > 0 ? (
        <nav aria-label="Módulos del sistema" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <li key={mod.href}>
                  <Link href={mod.href} className={moduleLinkClass}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{mod.title}</p>
                      <p className="truncate text-xs text-slate-500">{mod.description}</p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500",
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
