import Link from "next/link";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 p-6">
      <p className="text-sm font-semibold tabular-nums text-slate-500">404</p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">No encontrado</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        La página o el documento que busca no existe o no está disponible.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "sm" }), "bg-slate-900")}>
        Volver al inicio
      </Link>
    </main>
  );
}
