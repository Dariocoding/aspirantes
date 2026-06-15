import Link from "next/link";
import { auth } from "@src/auth";
import { unauthorized } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import {
  MANUAL_USUARIO_SUBTITLE,
  MANUAL_USUARIO_TITLE,
  manualUsuarioIntro,
  manualUsuarioResumenRoles,
  manualUsuarioSections,
} from "@src/lib/manual-usuario-content";
import { routes } from "@src/lib/apps/routes";
import { ManualUsuarioToolbar } from "./manual-usuario-toolbar";

export default async function ManualUsuarioPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  return (
    <div className="min-w-0 space-y-6 print:space-y-4">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 print:border-0 print:pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-balance text-2xl font-bold text-slate-900">{MANUAL_USUARIO_TITLE}</h1>
          <p className="max-w-prose text-pretty text-sm text-slate-600">{MANUAL_USUARIO_SUBTITLE}</p>
        </div>
        <ManualUsuarioToolbar />
      </header>

      <Card className="border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Introducción</CardTitle>
          <CardDescription>Versión alineada con los permisos y la auditoría del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-slate-700">
          {manualUsuarioIntro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen por rol</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-800">Rol</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Censo</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Exportación</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Administración</th>
              </tr>
            </thead>
            <tbody>
              {manualUsuarioResumenRoles.map((r) => (
                <tr key={r.rol} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{r.rol}</td>
                  <td className="px-3 py-2 text-slate-700">{r.censo}</td>
                  <td className="px-3 py-2 text-slate-700">{r.export}</td>
                  <td className="px-3 py-2 text-slate-700">{r.config}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {manualUsuarioSections.map((sec) => (
          <Card
            key={sec.id}
            className="border-slate-200 shadow-sm print:break-inside-avoid print:shadow-none print:border-slate-300"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900">{sec.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-700">
              {sec.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {sec.bullets?.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  {sec.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500 print:pt-4">
        <Link href={routes.personal.home} className="text-slate-600 underline print:hidden">
          Volver al panel
        </Link>
          <span className="hidden print:inline">Uso interno — FANB</span>
      </p>
    </div>
  );
}
