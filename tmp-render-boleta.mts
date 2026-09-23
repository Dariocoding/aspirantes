import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { BoletasPermisoPdfDocument } from "@src/lib/pdf/boleta-permiso-document";
import {
  readBoletaBanderaJpgBuffer,
  readBoletaCefoaLogoPngBuffer,
  readBoletaEjercitoLogoPngBuffer,
} from "@src/lib/pdf/institution-logo";

const convocatoria = {
  nombre: "Oficiales asimilados 2026-2027",
  codigo: "CEFOA-46",
  anio: 2026,
  cursoNro: "46",
  directorNombre: "CNEL. ANÍBAL DE JESÚS ZERPA ABREU",
  directorCargo: "DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN DE OFICIALES EN LA CATEGORÍA DE ASIMILADOS",
  headerLines: [
    "República Bolivariana de Venezuela",
    "Ministerio del Poder Popular para la Defensa",
    "Ejército Bolivariano",
    "Dirección de Educación del Ejército",
    "Oficiales asimilados 2026-2027",
  ],
};

function card(
  id: string,
  serial: string,
  nombres: string,
  apellidos: string,
  cedula: string,
  extra: Record<string, string> = {},
) {
  return {
    id,
    serial,
    nombres,
    apellidos,
    cedula,
    cabello: "CASTAÑO OSCURO",
    grupoSanguineo: "ORH+",
    ojos: "CAFÉ",
    colorPiel: "MORENA",
    direccion: "Urbanización el arrecoston calle principal casa número 2, la fría estado Táchira",
    telefono: "0424-7447673",
    emergenciaDireccion: "La fría. Urbanización el arrecoston",
    emergenciaTelefono: "0412-1715175",
    foto: null,
    ...extra,
  };
}

const doc = createElement(BoletasPermisoPdfDocument, {
  convocatoria,
  cards: [
    card("a1", "001", "ROXANA ABIGAIL", "AGAMEZ DELGADO", "25496478"),
    card("a2", "002", "JESUS ALEJANDRO", "ALFARO", "25429284", {
      grupoSanguineo: "ARH+",
      colorPiel: "BLANCA",
      direccion: "Viñedo calle 16 Barcelona Edo anzoategui",
      telefono: "0412-9409241",
    }),
  ],
  logoCefoa: readBoletaCefoaLogoPngBuffer(),
  logoEjercito: readBoletaEjercitoLogoPngBuffer(),
  bandera: readBoletaBanderaJpgBuffer(),
});

const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
writeFileSync("C:/Users/javie/AppData/Local/Temp/boleta-preview.pdf", buffer);
console.log("wrote", buffer.length);
