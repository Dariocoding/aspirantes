import { MailWarning } from "lucide-react";

export function HubEmptyState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/80 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <MailWarning className="h-6 w-6 text-slate-500" aria-hidden />
      </div>
      <h2 className="mt-5 text-base font-semibold text-slate-900">Sin aplicaciones asignadas</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Su cuenta no tiene acceso a ningún módulo en este momento. Solicite al administrador del sistema que
        configure los permisos correspondientes.
      </p>
    </div>
  );
}
