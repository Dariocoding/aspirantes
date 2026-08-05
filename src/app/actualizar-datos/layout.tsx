import type { ReactNode } from "react";

/** Portal público (sin sidebar del dashboard). */
export default function ActualizarDatosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 scheme-light antialiased">{children}</div>
  );
}
