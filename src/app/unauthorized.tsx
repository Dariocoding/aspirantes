import Link from "next/link";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 p-6">
      <p className="text-sm font-semibold tabular-nums text-slate-500">401</p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sesión requerida</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        Debe iniciar sesión para ver esta página.
      </p>
      <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "bg-slate-900")}>
        Ir al acceso
      </Link>
    </main>
  );
}
