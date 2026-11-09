"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Save } from "lucide-react";
import { conversarAgenteRoles, guardarSkillAgente } from "@src/app/actions/agente-roles";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Textarea } from "@src/components/ui/textarea";
import { cn } from "@src/lib/utils";

type Burbuja = {
  id: string;
  role: "user" | "assistant";
  text: string;
  pasos: string[];
};

const EJEMPLOS = [
  "Revisa la equidad del 9 al 13 de noviembre de 2026 y dime quién está por encima.",
  "¿Quién monta el viernes 13 de noviembre de 2026?",
  "Léeme las reglas y dime quién no puede montar.",
];

export function AgenteRolesPanel({ skillInicial }: { skillInicial: string | null }) {
  const [skill, setSkill] = useState(skillInicial ?? "");
  const [base, setBase] = useState(skillInicial ?? "");
  const [skillRemota, setSkillRemota] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [avisoSkill, setAvisoSkill] = useState<string | null>(null);
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const skillRef = useRef(skill);
  const baseRef = useRef(base);
  skillRef.current = skill;
  baseRef.current = base;

  useEffect(() => {
    const caja = listaRef.current;
    if (!caja) return;
    caja.scrollTop = caja.scrollHeight;
  }, [burbujas, enviando]);

  if (skillInicial == null) {
    return (
      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-base text-slate-900">Agente de roles de servicio</CardTitle>
          <CardDescription>
            No pude abrir la skill. La tabla del agente todavía no está en la base de datos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sucia = skill !== base;

  async function guardar() {
    setGuardando(true);
    setAvisoSkill(null);
    const resultado = await guardarSkillAgente(skill);
    setGuardando(false);
    if (!resultado.ok) {
      setAvisoSkill(resultado.message);
      return;
    }
    setSkill(resultado.skill);
    setBase(resultado.skill);
    setSkillRemota(null);
    setAvisoSkill("Reglas guardadas. El agente ya las usa.");
  }

  function tomarSkillRemota() {
    if (!skillRemota) return;
    setSkill(skillRemota);
    setBase(skillRemota);
    setSkillRemota(null);
    setAvisoSkill("Traje la skill que guardó el agente.");
  }

  async function enviar() {
    const texto = borrador.trim();
    if (!texto || enviando) return;
    const propia: Burbuja = { id: crypto.randomUUID(), role: "user", text: texto, pasos: [] };
    const siguientes = [...burbujas, propia];
    setBurbujas(siguientes);
    setBorrador("");
    setError(null);
    setEnviando(true);
    const resultado = await conversarAgenteRoles(
      siguientes.slice(-12).map((item) => ({ role: item.role, text: item.text })),
    );
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.message);
      return;
    }
    setBurbujas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", text: resultado.texto, pasos: resultado.pasos },
    ]);
    if (resultado.skill) {
      if (skillRef.current === baseRef.current) {
        setSkill(resultado.skill);
        setBase(resultado.skill);
        setSkillRemota(null);
      } else {
        setSkillRemota(resultado.skill);
      }
    }
  }

  return (
    <section className="space-y-3" aria-label="Agente de roles de servicio">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Agente de roles de servicio</h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Solo lo ves tú. Diseña, agrega, mueve y elimina guardias, y puede cambiar estas reglas. Tú también puedes
            editarlas, agregar o quitar líneas, y guardarlas.
          </p>
        </div>
        <Badge variant="secondary">Super administrador</Badge>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
          <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
                <Bot className="h-4 w-4 text-slate-700" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Chat</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Una orden concreta la aplica. Un reajuste de varios días te lo confirma antes de guardar.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex h-[32rem] flex-col p-0">
            <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
              {burbujas.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Puedes empezar por una de estas:</p>
                  {EJEMPLOS.map((ejemplo) => (
                    <button
                      key={ejemplo}
                      type="button"
                      onClick={() => setBorrador(ejemplo)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-white"
                    >
                      {ejemplo}
                    </button>
                  ))}
                </div>
              ) : (
                burbujas.map((burbuja) => (
                  <div
                    key={burbuja.id}
                    className={cn("max-w-[92%] text-sm", burbuja.role === "user" ? "ml-auto" : "mr-auto")}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 whitespace-pre-wrap",
                        burbuja.role === "user"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-800",
                      )}
                    >
                      {burbuja.text}
                    </div>
                    {burbuja.pasos.length > 0 ? (
                      <ul className="mt-1.5 space-y-0.5 pl-1 text-xs text-slate-500">
                        {burbuja.pasos.map((paso, index) => (
                          <li key={`${burbuja.id}-${index}`}>{paso}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
              {enviando ? <p className="text-xs text-slate-500">Revisando las reglas y los roles…</p> : null}
            </div>
            <form
              className="border-t border-slate-200/80 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void enviar();
              }}
            >
              <Textarea
                value={borrador}
                onChange={(event) => setBorrador(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void enviar();
                  }
                }}
                placeholder="Pide un cambio de guardia o una regla nueva"
                aria-label="Mensaje para el agente"
                rows={3}
                className="field-sizing-fixed max-h-36 min-h-16 resize-none bg-white"
                disabled={enviando}
              />
              {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={enviando || borrador.trim().length === 0}>
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Enviar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
          <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
            <CardTitle className="text-base font-semibold text-slate-900">Reglas del agente</CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Esta skill es la que obedece. Cámbiala aquí o pídeselo en el chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <Textarea
              value={skill}
              onChange={(event) => {
                setSkill(event.target.value);
                setAvisoSkill(null);
              }}
              aria-label="Skill del agente"
              spellCheck
              className="field-sizing-fixed h-[26rem] resize-y bg-white font-mono text-xs leading-relaxed"
            />
            {skillRemota ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                <p>El agente guardó otra versión y tú tienes cambios sin guardar.</p>
                <button type="button" onClick={tomarSkillRemota} className="mt-1 font-medium underline">
                  Traer la versión del agente
                </button>
              </div>
            ) : null}
            {avisoSkill ? <p className="text-xs text-slate-600">{avisoSkill}</p> : null}
            <Button type="button" onClick={() => void guardar()} disabled={guardando || !sucia} className="w-full">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Guardar reglas
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
