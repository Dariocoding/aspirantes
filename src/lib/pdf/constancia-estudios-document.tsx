import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { cursoNroFromConvocatoria } from "@src/lib/pdf/boleta-permiso";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const INK = "#000000";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const RANGOS = [
  "GENERAL EN JEFE",
  "MAYOR GENERAL",
  "GENERAL DE DIVISIÓN",
  "GENERAL DE DIVISION",
  "GENERAL DE BRIGADA",
  "VICEALMIRANTE",
  "CONTRALMIRANTE",
  "ALMIRANTE",
  "TENIENTE CORONEL",
  "CORONEL",
  "CAPITÁN DE NAVÍO",
  "CAPITAN DE NAVIO",
  "CAPITÁN DE FRAGATA",
  "CAPITAN DE FRAGATA",
  "CAPITÁN DE CORBETA",
  "CAPITAN DE CORBETA",
  "CAPITÁN",
  "CAPITAN",
  "MAYOR",
  "TENIENTE DE NAVÍO",
  "TENIENTE DE NAVIO",
  "TENIENTE",
] as const;

export type ConstanciaEstudiosPerson = {
  nombres: string;
  apellidos: string;
  cedula: string;
  trato: string;
  fechaNacimiento: string;
  tipoEstudio: string;
  universidad: string;
  nucleo: string;
  titulo: string;
  pais: string;
  anioIngreso: string;
  anioEgreso: string;
  unidad: string;
  peloton: string;
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  convocatoriaAnio: string;
  anioVence: number | null;
  comandante: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 12,
    color: INK,
    backgroundColor: "#ffffff",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 58,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoEjercito: {
    width: 58,
  },
  logoDireccion: {
    width: 78,
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  headerLine: {
    fontSize: 7.5,
    lineHeight: 1.15,
    textAlign: "center",
    textTransform: "uppercase",
  },
  titleWrap: {
    marginTop: 26,
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
    letterSpacing: 0.4,
  },
  body: {
    fontSize: 12,
    lineHeight: 1.35,
    textAlign: "justify",
    marginBottom: 12,
  },
  mark: {
    fontSize: 12,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  dios: {
    marginTop: 22,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  watermark: {
    position: "absolute",
    top: 500,
    left: 170,
    width: 240,
  },
  sign: {
    marginTop: 72,
    alignItems: "center",
  },
  signName: {
    fontSize: 12.5,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  signRank: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  signCargo: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.18,
  },
  resolucion: {
    marginTop: 7,
    fontSize: 7,
    textAlign: "center",
  },
  motto: {
    marginTop: 1,
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.15,
  },
  mottoFirst: {
    marginTop: 8,
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.15,
  },
  address: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.15,
  },
  addressFirst: {
    marginTop: 6,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.15,
  },
});

function upper(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleUpperCase("es");
}

function splitFirmante(raw: string): { rango: string; nombre: string } {
  const nombre = upper(raw);
  if (!nombre) return { rango: "", nombre: "" };
  for (const rango of RANGOS) {
    if (nombre === rango) return { rango, nombre: "" };
    if (nombre.startsWith(`${rango} `)) {
      return { rango, nombre: nombre.slice(rango.length).trim() };
    }
  }
  return { rango: "", nombre };
}

function cedulaConstancia(cedula: string): string {
  const raw = cedula.trim().toUpperCase();
  const prefix = raw.startsWith("E") ? "E" : "V";
  const digits = raw.replace(/\D/g, "");
  return digits ? `${prefix}-${digits}` : raw || "—";
}

function periodoDe(person: ConstanciaEstudiosPerson): string {
  const anio = Number.parseInt(person.convocatoriaAnio, 10);
  const inicio = Number.isInteger(anio) ? anio : new Date().getFullYear();
  const fin =
    person.anioVence != null && Number.isInteger(person.anioVence) ? person.anioVence : inicio + 1;
  return `${inicio}-${fin}`;
}

function cursoNro(person: ConstanciaEstudiosPerson): string {
  return cursoNroFromConvocatoria({
    codigo: person.convocatoriaCodigo,
    nombre: person.convocatoriaNombre,
  });
}

function fechaExpedicion(date: Date): string {
  const dia = date.getDate();
  const mes = MESES[date.getMonth()] ?? "";
  const cuando = dia === 1 ? "al 1 día" : `a los ${dia} días`;
  return `${cuando} del mes de ${mes} del año ${date.getFullYear()}`;
}

function ConstanciaPage({
  person,
  emitida,
  logoEjercito,
  logoDireccion,
  marcaAgua,
}: {
  person: ConstanciaEstudiosPerson;
  emitida: Date;
  logoEjercito: string | null;
  logoDireccion: string | null;
  marcaAgua: string | null;
}) {
  const estudiante = upper(`${person.nombres} ${person.apellidos}`);
  const firmante = splitFirmante(person.comandante);
  const firmanteLinea = [firmante.rango, firmante.nombre].filter(Boolean).join(" ");
  const nro = cursoNro(person);
  const cefoa = nro ? `CEFOA N° ${nro}` : "CEFOA";
  const periodo = periodoDe(person);
  const cedula = cedulaConstancia(person.cedula);

  return (
    <Page size="LETTER" style={styles.page}>
      {marcaAgua ? <Image src={marcaAgua} style={styles.watermark} /> : null}
      <View style={styles.header}>
        {logoEjercito ? <Image src={logoEjercito} style={styles.logoEjercito} /> : <View style={styles.logoEjercito} />}
        <View style={styles.headerText}>
          <Text style={styles.headerLine}>República Bolivariana de Venezuela</Text>
          <Text style={styles.headerLine}>Ministerio del Poder Popular para la Defensa</Text>
          <Text style={styles.headerLine}>Ejército Bolivariano</Text>
          <Text style={styles.headerLine}>Dirección de Educación del Ejército Bolivariano</Text>
          <Text style={styles.headerLine}>
            Curso Especial de Formación de Oficiales en la Categoría de Asimilado
          </Text>
          <Text style={styles.headerLine}>y Asimilado Técnico</Text>
        </View>
        {logoDireccion ? (
          <Image src={logoDireccion} style={styles.logoDireccion} />
        ) : (
          <View style={styles.logoDireccion} />
        )}
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>CONSTANCIA DE ESTUDIO</Text>
      </View>

      <Text style={styles.body}>
        {`Quien suscribe, `}
        <Text style={styles.mark}>{`${firmanteLinea || "EL DIRECTOR"},`}</Text>
        {"\n"}
        <Text style={styles.mark}>
          {`Director del Liceo Militar Gran Mariscal de Ayacucho y del Curso Especial de Formación de Oficiales Asimilados y Asimilado Técnico (${cefoa}),`}
        </Text>
        {"\n"}
        {`por medio de la presente `}
        <Text style={styles.mark}>CERTIFICO</Text>
        {` que ${person.trato}: `}
        <Text style={styles.mark}>{estudiante}</Text>
        {`, titular de la Cédula de Identidad `}
        <Text style={styles.mark}>{`Nro. ${cedula}`}</Text>
        {`, se encuentra cursando el Curso Especial de Formación de Oficiales Asimilado y Asimilado Técnico `}
        <Text style={styles.mark}>{`(PERIODO ${periodo})`}</Text>
        {` en este centro de formación.`}
      </Text>

      <Text style={styles.body}>
        {`Constancia que se expide a petición de parte interesada en Caracas, ${fechaExpedicion(emitida)}, para los fines legales y consiguientes a que dé lugar.`}
      </Text>

      <Text style={styles.dios}>DIOS Y FEDERACIÓN</Text>

      <View style={styles.sign}>
        {firmante.nombre ? <Text style={styles.signName}>{firmante.nombre}</Text> : null}
        {!firmante.nombre && firmanteLinea ? <Text style={styles.signName}>{firmanteLinea}</Text> : null}
        {firmante.rango ? <Text style={styles.signRank}>{firmante.rango}</Text> : null}
        <Text style={styles.signCargo}>
          {"DIRECTOR DEL LICEO MILITAR GRAN MARISCAL DE AYACUCHO Y DEL\nCURSO ESPECIAL DE FORMACIÓN DE OFICIALES ASIMILADO Y\nASIMILADO TÉCNICO"}
        </Text>
        <Text style={styles.resolucion}>
          Designado Mediante Resolución N° 068681 de fecha 14 de septiembre de 2024
        </Text>
        <Text style={styles.mottoFirst}>"CHÁVEZ VIVE, LA PATRIA SIGUE"</Text>
        <Text style={styles.motto}>¡INDEPENDENCIA O NADA!</Text>
        <Text style={styles.motto}>¡LEALES SIEMPRE, TRAIDORES NUNCA!</Text>
        <Text style={styles.motto}>¡INTEGRAR, ES VENCER!</Text>
        <Text style={styles.motto}>¡LA CONSIGNA ES TRIUNFAR!</Text>
        <Text style={styles.addressFirst}>CARACAS MUNICIPIO LIBERTADOR, SECTOR RUIZ PINEDA DE CARICUAO, LOS</Text>
        <Text style={styles.address}>TELARES, LICEO MILITAR GRAN MARISCAL DE AYACUCHO</Text>
        <Text style={styles.address}>TELEFONO 04166427379</Text>
      </View>
    </Page>
  );
}

export function ConstanciaEstudiosPdfDocument({
  people,
  emitidaEn,
  logoEjercito,
  logoDireccion,
  marcaAgua,
}: {
  people: ConstanciaEstudiosPerson[];
  /** Fecha ya formateada; se conserva por compatibilidad. La hoja usa el día de emisión. */
  emitidaEn?: string;
  logoEjercito: string | null;
  logoDireccion: string | null;
  marcaAgua: string | null;
}) {
  const emitida = new Date();
  void emitidaEn;
  return (
    <Document title="Constancia de estudio" author="CEFOA">
      {people.map((person) => (
        <ConstanciaPage
          key={`${person.cedula}-${person.convocatoriaCodigo}`}
          person={person}
          emitida={emitida}
          logoEjercito={logoEjercito}
          logoDireccion={logoDireccion}
          marcaAgua={marcaAgua}
        />
      ))}
    </Document>
  );
}
