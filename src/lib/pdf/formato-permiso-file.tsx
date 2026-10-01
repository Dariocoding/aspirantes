import { Document } from "@react-pdf/renderer";
import { FormatoPermisoPdfDocument } from "@src/lib/pdf/formato-permiso-document";
import type { FormatoPermisoPresentacion } from "@src/lib/pdf/formato-permiso";

export function FormatoPermisoPdfFile({
  presentacion,
  logoIzq,
  logoDer,
}: {
  presentacion: FormatoPermisoPresentacion;
  logoIzq: string | null;
  logoDer: string | null;
}) {
  return (
    <Document>
      <FormatoPermisoPdfDocument presentacion={presentacion} logoIzq={logoIzq} logoDer={logoDer} />
    </Document>
  );
}
