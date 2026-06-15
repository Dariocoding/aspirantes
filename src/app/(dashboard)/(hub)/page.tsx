import { AppLauncher } from "@dashboard/_components/home/app-launcher";
import { HubEmptyState } from "@dashboard/_components/home/hub-empty-state";
import { auth } from "@src/auth";
import { listAccessibleApps } from "@src/lib/apps/registry";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { redirect, unauthorized } from "next/navigation";

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const apps = listAccessibleApps(authContextFromSession(session));

  if (apps.length === 1) {
    redirect(apps[0].homeHref);
  }

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-8">
      {/*     <HubPortalHero
        userName={session.user.name}
        roleLabel={session.user.roleLabel}
        appCount={apps.length}
      />
 */}
      {apps.length === 0 ? <HubEmptyState /> : <AppLauncher apps={apps} />}

      <p className="text-center text-xs text-slate-500">
        El acceso a cada módulo depende de los permisos asignados a su cuenta
        institucional.
      </p>
    </div>
  );
}
