import Link from "next/link";
import {
  Cake,
  CalendarDays,
  FileDown,
  Info,
  Printer,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { createBirthdayEsquela, createEfemerideEsquela } from "@src/app/actions/esquelas";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { routes } from "@src/lib/apps/routes";
import { calificacionAdmisionEtiqueta } from "@src/lib/aspirantes/census";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { prisma } from "@src/lib/prisma";
import { cn } from "@src/lib/utils";
import { CalificacionAdmision, type Prisma, type TipoEsquela } from "@src/generated/prisma";

function labelTipoEsquela(tipo: TipoEsquela) {
  switch (tipo) {
    case "CUMPLEANOS":
      return "Cumpleaños";
    case "EFEMERIDE":
      return "Efeméride";
    default:
      return tipo;
  }
}

function tipoEsquelaBadgeClass(tipo: TipoEsquela) {
  switch (tipo) {
    case "CUMPLEANOS":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "EFEMERIDE":
      return "border-violet-200 bg-violet-50 text-violet-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function tipoEsquelaAccentBorder(tipo: TipoEsquela) {
  switch (tipo) {
    case "CUMPLEANOS":
      return "border-l-sky-500";
    case "EFEMERIDE":
      return "border-l-violet-500";
    default:
      return "border-l-slate-400";
  }
}

function calificacionMiniBadgeClass(c: string) {
  if (c === "APTO") return "border-emerald-200/90 bg-emerald-50/90 text-emerald-900";
  if (c === "NO_APTO") return "border-red-200/90 bg-red-50/90 text-red-900";
  return "border-amber-200/90 bg-amber-50/90 text-amber-900";
}

function inicialesAspirante(nombres: string, apellidos: string) {
  const n = nombres.trim().charAt(0);
  const a = apellidos.trim().charAt(0);
  const s = `${n}${a}`.toUpperCase();
  return s || "?";
}

const CALIFICACION_ESQUELAS: CalificacionAdmision[] = [
  CalificacionAdmision.APTO,
  CalificacionAdmision.EN_EVALUACION,
];

export default async function EsquelasPage() {
  const session = await auth();
  if (!session?.user) return null;
  const write = hasPermission(authContextFromSession(session), Permission.ESQUELAS_WRITE);

  const convocatoriaActiva = await getConvocatoriaActiva();
  const aspiranteWhere: Prisma.AspiranteWhereInput = {
    calificacionAdmision: { in: CALIFICACION_ESQUELAS },
    ...(convocatoriaActiva ? { convocatoriaId: convocatoriaActiva.id } : {}),
  };

  const esquelaWhere: Prisma.EsquelaWhereInput = {
    OR: [
      { aspiranteId: null },
      { aspirante: { calificacionAdmision: { in: CALIFICACION_ESQUELAS } } },
    ],
  };

  const [aspirantes, efemerides, esquelas] = await Promise.all([
    prisma.aspirante.findMany({ where: aspiranteWhere, orderBy: { nombres: "asc" } }),
    prisma.efemeride.findMany({ orderBy: [{ mes: "asc" }, { dia: "asc" }] }),
    prisma.esquela.findMany({
      where: esquelaWhere,
      orderBy: { createdAt: "desc" },
      include: { aspirante: true, efemeride: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50 via-white to-sky-50/40 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <ScrollText className="h-5 w-5 text-slate-800" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Generador de esquelas</h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                Documentos memorísticos por cumpleaños o fechas del calendario cívico. Solo se listan aspirantes{" "}
                <span className="font-medium text-slate-800">apto</span> o{" "}
                <span className="font-medium text-slate-800">en evaluación</span>. Historial con impresión y PDF.
              </p>
            </div>
          </div>
          <dl className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs shadow-sm">
              <dt className="text-slate-500">Elegibles</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{aspirantes.length}</dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs shadow-sm">
              <dt className="text-slate-500">Efemérides</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{efemerides.length}</dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs shadow-sm">
              <dt className="text-slate-500">Historial</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{esquelas.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      {!write ? (
        <div className="flex gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-700 shadow-sm shadow-slate-900/5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p>
            Su rol es de solo consulta: puede ver el historial y descargar PDF, pero no generar nuevas esquelas.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/60">
          <CardHeader className="border-b border-slate-200/80 bg-linear-to-r from-slate-50/90 to-white py-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-50 shadow-sm">
                <Cake className="h-5 w-5 text-sky-800" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold text-slate-900">Esquela de cumpleaños</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-600">
                  Convocatoria activa: solo aptos y en evaluación.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[min(24rem,58vh)] space-y-1 overflow-y-auto p-3 sm:p-4">
              {aspirantes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <Cake className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-slate-800">No hay aspirantes elegibles</p>
                  <p className="max-w-xs px-2 text-xs leading-relaxed text-slate-500">
                    No hay aspirantes apto o en evaluación en esta convocatoria. Los calificados como no apto no
                    aparecen aquí.
                  </p>
                </div>
              ) : write ? (
                aspirantes.map((a) => (
                  <form
                    action={createBirthdayEsquela}
                    key={a.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-slate-200/80 hover:bg-slate-50/90"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 shadow-sm"
                        aria-hidden
                      >
                        {inicialesAspirante(a.nombres, a.apellidos)}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {a.nombres} {a.apellidos}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                            calificacionMiniBadgeClass(a.calificacionAdmision),
                          )}
                        >
                          {calificacionAdmisionEtiqueta(a.calificacionAdmision)}
                        </span>
                      </div>
                    </div>
                    <input type="hidden" name="aspiranteId" value={a.id} />
                    <Button
                      type="submit"
                      size="sm"
                      className="shrink-0 gap-1.5 shadow-sm"
                      variant="secondary"
                    >
                      <ScrollText className="h-3.5 w-3.5" aria-hidden />
                      Generar
                    </Button>
                  </form>
                ))
              ) : (
                aspirantes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-2 py-2.5 text-sm text-slate-700"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-xs font-semibold text-slate-600">
                      {inicialesAspirante(a.nombres, a.apellidos)}
                    </span>
                    <span className="min-w-0 truncate font-medium">
                      {a.nombres} {a.apellidos}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/60">
          <CardHeader className="border-b border-slate-200/80 bg-linear-to-r from-slate-50/90 to-white py-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/80 bg-violet-50 shadow-sm">
                <CalendarDays className="h-5 w-5 text-violet-800" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold text-slate-900">Esquela de efeméride</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-600">
                  Conmemoraciones y fechas del calendario institucional.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[min(24rem,58vh)] space-y-1 overflow-y-auto p-3 sm:p-4">
              {efemerides.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <CalendarDays className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-slate-800">No hay efemérides registradas</p>
                  <p className="max-w-xs px-2 text-xs leading-relaxed text-slate-500">
                    Añada fechas en el módulo de efemérides para generar documentos.
                  </p>
                </div>
              ) : write ? (
                efemerides.map((e) => (
                  <form
                    action={createEfemerideEsquela}
                    key={e.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-slate-200/80 hover:bg-slate-50/90"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-[10px] font-bold tabular-nums text-violet-900">
                        {String(e.dia).padStart(2, "0")}/{String(e.mes).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-slate-900">{e.nombre}</span>
                    </div>
                    <input type="hidden" name="efemerideId" value={e.id} />
                    <Button
                      type="submit"
                      size="sm"
                      className="shrink-0 gap-1.5 shadow-sm"
                      variant="secondary"
                    >
                      <ScrollText className="h-3.5 w-3.5" aria-hidden />
                      Generar
                    </Button>
                  </form>
                ))
              ) : (
                efemerides.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-2 py-2.5 text-sm text-slate-700"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-[10px] font-bold tabular-nums text-violet-900">
                      {String(e.dia).padStart(2, "0")}/{String(e.mes).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 truncate">{e.nombre}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/60">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-r from-slate-50/90 to-white py-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <Sparkles className="h-5 w-5 text-amber-600" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-slate-900">Historial de esquelas</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-slate-600">
                    Del más reciente al más antiguo. Las vinculadas a aspirantes no apto no se muestran.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3 sm:p-4">
          {esquelas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <ScrollText className="h-6 w-6" aria-hidden />
              </div>
              <p className="font-medium text-slate-800">Año no hay esquelas generadas</p>
              <p className="max-w-sm px-2 text-xs leading-relaxed text-slate-500">
                {write
                  ? "Use las tarjetas anteriores para crear la primera esquela."
                  : "Cuando se generen documentos, aparecerán aquí con enlaces de impresión y PDF."}
              </p>
            </div>
          ) : (
            esquelas.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-slate-200/80 border-l-4 bg-white p-3.5 pl-3.5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-4",
                  tipoEsquelaAccentBorder(item.tipo),
                )}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        tipoEsquelaBadgeClass(item.tipo),
                      )}
                    >
                      {labelTipoEsquela(item.tipo)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      {item.fechaEvento.toLocaleDateString("es-VE")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-slate-900">{item.titulo}</p>
                  <p className="text-xs text-slate-500">
                    <span className="tabular-nums">{item.createdAt.toLocaleString("es-VE")}</span>
                    {item.aspirante ? (
                      <>
                        <span className="text-slate-300"> · </span>
                        <span className="font-medium text-slate-700">
                          {item.aspirante.nombres} {item.aspirante.apellidos}
                        </span>
                      </>
                    ) : null}
                    {item.efemeride ? (
                      <>
                        <span className="text-slate-300"> · </span>
                        <span className="font-medium text-slate-700">{item.efemeride.nombre}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  <Link
                    href={routes.personal.esquela(item.id)}
                    prefetch={false}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9 gap-1.5 border-slate-200 bg-white shadow-sm",
                    )}
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                      Impresión
                  </Link>
                  <a
                    href={`/api/esquelas/${item.id}/pdf`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "h-9 gap-1.5 bg-slate-900 shadow-sm hover:bg-slate-800",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown className="h-3.5 w-3.5" aria-hidden />
                    PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
