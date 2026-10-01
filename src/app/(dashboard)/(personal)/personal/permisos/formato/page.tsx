import { unauthorized } from "next/navigation";
import { FormatoPermisoView } from "@dashboard/permisos/_components/formato-permiso-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { loadFormatoPermisoPlantilla } from "@src/lib/pdf/load-formato-permiso";

export default async function FormatoPermisoPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const [plantilla, convocatoria] = await Promise.all([
    loadFormatoPermisoPlantilla(),
    getConvocatoriaActiva(),
  ]);

  return (
    <FormatoPermisoView
      plantilla={plantilla}
      canWrite={canWrite(ctx)}
      comandanteNombre={convocatoria?.comandanteNombre ?? null}
    />
  );
}
