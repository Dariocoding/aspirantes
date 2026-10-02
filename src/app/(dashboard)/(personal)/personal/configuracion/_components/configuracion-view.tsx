import type { ConfigCard } from "@src/lib/apps/registry";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import { cn } from "@src/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Props = {
  cards: ConfigCard[];
};

export function ConfiguracionView({ cards }: Props) {
  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-4">
      <header className="flex min-w-0 flex-wrap items-center gap-3">
        <CefoaCrest size="sm" priority className="drop-shadow-none" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Configuración
          </h1>
          <p className="text-xs text-slate-500">
            Herramientas institucionales: efemérides, documentos y períodos.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <FanbFlagStripe className="h-1" />
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-medium text-slate-800">Módulos disponibles</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Seleccione una tarjeta para abrir la vista correspondiente.
          </p>
        </div>

        {cards.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No hay módulos de configuración disponibles para su rol.
          </p>
        ) : (
          <ul className="grid list-none gap-3 p-4 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <li key={card.href} className="min-w-0">
                  <Link
                    href={card.href}
                    className={cn(
                      "group flex h-full min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-4",
                      "transition-colors hover:border-slate-300 hover:bg-slate-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 focus-visible:ring-offset-2",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                        card.tone,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {card.label}
                        </span>
                        <ArrowRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                          aria-hidden
                        />
                      </span>
                      <span className="mt-1 block text-pretty text-xs leading-relaxed text-slate-500">
                        {card.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
