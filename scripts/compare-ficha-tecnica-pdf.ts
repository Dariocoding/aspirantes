/**
 * Paso 1: genera PDF (tsx). Paso 2: raster + diff (node ESM / mupdf).
 * Uso: npx tsx scripts/compare-ficha-tecnica-pdf.ts
 */
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { emptyFichaEvaluacion } from "../src/lib/aspirantes/ficha-evaluacion";
import { AspiranteFichaTecnicaPdfDocument } from "../src/lib/pdf/aspirante-ficha-tecnica-document";
import { registerFichaTecnicaPdfFonts } from "../src/lib/pdf/register-ficha-tecnica-fonts";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "tmp-ficha-compare");

async function main() {
  registerFichaTecnicaPdfFonts();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ficha = emptyFichaEvaluacion();
  ficha.pruebaFisica.filas.potencia_aerobica_2400m = {
    ...ficha.pruebaFisica.filas.potencia_aerobica_2400m!,
    datosF: "13:00",
  };
  ficha.pruebaFisica.filas.barra_fija_dominada = {
    ...ficha.pruebaFisica.filas.barra_fija_dominada!,
    datosF: "10",
  };
  ficha.pruebaFisica.filas.abdominales_60 = {
    ...ficha.pruebaFisica.filas.abdominales_60!,
    datosF: "50",
  };
  ficha.pruebaFisica.filas.flexiones_60 = {
    ...ficha.pruebaFisica.filas.flexiones_60!,
    datosF: "35",
  };
  ficha.pruebaFisica.filas.natacion_50m = {
    ...ficha.pruebaFisica.filas.natacion_50m!,
    datosF: "50 M",
  };
  ficha.pruebaFisica.calificacionObtenida = "20,00";

  const fotoPng = fs.readFileSync(path.join(OUT_DIR, "foto-ref.jpg"));

  const el = createElement(AspiranteFichaTecnicaPdfDocument, {
    nombres: "MAYRA ALEJANDRA",
    apellidos: "LEON CORTEZ",
    cedula: "26057693",
    edad: 28,
    sexo: "FEMENINO",
    telefono: "04241359535",
    hijosCantidad: 0,
    unidadPostulante: "CEOFANB / CEFOA Nº 46",
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    foto: fotoPng,
    ficha,
    estadoCivil: "SOLTERA",
    especialidad: "ABOGADA",
    nivelEducativo: "UNIVERSITARIO",
    ordenMerito: "01",
    cmdteCursoNombre: "CNEL. FREDDY JOSE GONZALEZ LOVERA",
    cmdteCursoTelefono: "04120940389",
    otorgamientoGrado: "TTE_TC",
    investigacionAdministrativa: false,
    investigacionPenalMilitar: false,
    investigacionJudicial: false,
    juicioAbierto: false,
    registroSiipol: false,
    estudioCulminado: true,
    estudioCulminadoPorQue: "",
    estudios: [
      {
        universidad: "UNIVERSIDAD BOLIVARIANA DE VENEZUELA",
        titulo: "ABOGADA",
        pais: "VENEZUELA",
        anioIngreso: "2019",
        anioEgreso: "2023",
        nucleo: "DTTO. CAPITAL",
      },
    ],
    apreciacionGeneral:
      "LA ASPIRANTE DEMOSTRÓ DURANTE EL DESARROLLO DEL CURSO DE ESPECIALIZACIÓN PARA LA FORMACIÓN DE OFICIALES DE ARMAS (CEFOA) Nº 46, UN ALTO DESEMPEÑO ACADÉMICO, DISCIPLINA Y COMPROMISO INSTITUCIONAL, MOTIVO POR EL CUAL SE PROPONE PARA EL OTORGAMIENTO DEL GRADO CORRESPONDIENTE CONFORME A LA NORMATIVA VIGENTE.",
    debug: false,
  });

  const pdfBuffer = Buffer.from(
    await renderToBuffer(el as Parameters<typeof renderToBuffer>[0]),
  );
  const pdfPath = path.join(OUT_DIR, "ficha-generada.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log("PDF:", pdfPath, pdfBuffer.length, "bytes");

  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/raster-diff-ficha.mjs")], {
    cwd: ROOT,
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
