import type { ReactNode } from "react";

/**
 * Login en tema claro (fondo neutro; acentos ámbar / verde en el formulario).
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 scheme-light antialiased">{children}</div>
  );
}
