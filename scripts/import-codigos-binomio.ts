/**
 * Carga códigos de binomio/cazare desde el PDF CEFOA 46 (cédula → código).
 * Uso: npx tsx scripts/import-codigos-binomio.ts
 */
import { config } from "dotenv";
import { setDefaultResultOrder } from "node:dns";
import { PrismaClient } from "../src/generated/prisma";
import { normalizarCodigoBinomio } from "../src/lib/aspirantes/binomio";

config({ path: ".env" });
config({ path: ".env.local", override: true });
setDefaultResultOrder("ipv4first");

/** Cédula (solo dígitos) → código manuscrito del PDF. */
const MAPA: Array<{ cedula: string; codigo: string; nombre: string }> = [
  // Pelotón 1 — A##
  { cedula: "21425976", codigo: "A01", nombre: "JUNIOR ALBENIS CAÑIZALES ROSALES" },
  { cedula: "21537528", codigo: "A03", nombre: "DANNY JOSE ESCOBAR MARRERO" },
  { cedula: "21658152", codigo: "A05", nombre: "JESSICA CELIA FUENTES MORA" },
  { cedula: "22615369", codigo: "A02", nombre: "PEDRO RICARDO TIMAURE ESCOBAR" },
  { cedula: "22677339", codigo: "A07", nombre: "GABRIEL ALEJANDRO MALDONADO ZAMBRANO" },
  { cedula: "24116919", codigo: "A04", nombre: "ELVIS ALBEIRO CHIRINOS ZAMBRANO" },
  { cedula: "24598208", codigo: "A06", nombre: "ANYELIS DEL VALLE SUCRE FIGUEROA" },
  { cedula: "24794596", codigo: "A09", nombre: "ELICER CAROLINA RODRIGUEZ MORALES" },
  { cedula: "24798124", codigo: "A10", nombre: "THAMYS NAIBETH ORTIZ ORTIZ" },
  { cedula: "24809009", codigo: "A11", nombre: "JONATHAN JOSE TOVAR GUTIERREZ" },
  { cedula: "25181819", codigo: "A13", nombre: "YENIFFER ANDREA SILVA GAMEZ" },
  { cedula: "25496478", codigo: "A15", nombre: "ROXANA ABIGAIL AGAMEZ DELGADO" },
  { cedula: "25880947", codigo: "A33", nombre: "JOSE DAVID RIVAS RODRIGUEZ" },
  { cedula: "25901970", codigo: "A17", nombre: "HEMALIS HEMALIORKA JIMENEZ HERRERA" },
  { cedula: "26057693", codigo: "A16", nombre: "ANIUSKA ROXANA LUGO RICO" },
  { cedula: "26436199", codigo: "A32", nombre: "ORLANDO LUIS RIVAS PASTRAN" },
  { cedula: "26458024", codigo: "A12", nombre: "GRENYER JOSE TORREALBA TORREALBA" },
  { cedula: "26752799", codigo: "A18", nombre: "MERCEDES AUDRI INMACULADA ROMERO GARCIA" },
  { cedula: "26866316", codigo: "A19", nombre: "JESUS ORLANDO DIAZ PEREZ" },
  { cedula: "27555861", codigo: "A21", nombre: "ADRIANA CAROLINA ESPINOLA MARQUEZ" },
  { cedula: "27643212", codigo: "A25", nombre: "CARLOS EDUARDO SALAZAR MORANTES" },
  { cedula: "27773101", codigo: "A20", nombre: "VICTOR ROMAN OSWEL QUIARO CASANAS" },
  { cedula: "28023488", codigo: "A27", nombre: "DARIO ALFONSO FLORES MONTESINOS" },
  { cedula: "28477889", codigo: "A26", nombre: "RAYNELL FELIPE MARIN SANCHEZ" },
  { cedula: "28760968", codigo: "A34", nombre: "JESUS EDUARDO AMADO RUIZ" },
  { cedula: "29867083", codigo: "A14", nombre: "LISBETH COROMOTO RODRIGUEZ TUA" },
  { cedula: "29912433", codigo: "A35", nombre: "GABRIELA ALEJANDRA CHACON MIRANDA" },
  { cedula: "29972684", codigo: "A29", nombre: "MOISES GERARDO ANDRADE RAMOS" },
  { cedula: "30264512", codigo: "A30", nombre: "ALIRIO MOAME PADILLA ZAPATA" },
  { cedula: "30476590", codigo: "A22", nombre: "AGATA WILLIAMS GIL" },
  { cedula: "30598046", codigo: "A28", nombre: "YEIN DANIEL CONTRERAS ARAY" },
  { cedula: "30601123", codigo: "A31", nombre: "IVAN LEONEL DE NAZARETH LINAREZ RODRIGUEZ" },
  { cedula: "30811001", codigo: "A08", nombre: "FRANYER JOSE ALVARADO RODRIGUEZ" },
  { cedula: "31227201", codigo: "A24", nombre: "GLORIANNY LUISANA SALAZAR MUNOZ" },
  { cedula: "32110919", codigo: "A23", nombre: "VANESSA CAROLINA RANGEL CAMBAR" },
  // Pelotón 2 — B##
  { cedula: "22294844", codigo: "B01", nombre: "YARELIS DEL CARMEN SILVA QUINTERO" },
  { cedula: "22795367", codigo: "B02", nombre: "MILAGROS DEL VALLE ALVAREZ TORRES" },
  { cedula: "22953149", codigo: "B03", nombre: "ANTHONY SANTIAGO BLANCO HERRERA" },
  { cedula: "22994887", codigo: "B05", nombre: "ALEXANDRA DEL VALLE RIVERO RODRIGUEZ" },
  { cedula: "23479110", codigo: "B06", nombre: "ZILVY ALEXANDRA MORALES PEROZO" },
  { cedula: "23537597", codigo: "B07", nombre: "LUISANA BERTILIA URE URE" },
  { cedula: "23733442", codigo: "B08", nombre: "ROMEIBIS ANADEL LEDEZMA CALDERA" },
  { cedula: "23953058", codigo: "B09", nombre: "JOSE ANGEL NAVAS VICUNA" },
  { cedula: "24497462", codigo: "B10", nombre: "JOSE ANTONIO HERNANDEZ PINA" },
  { cedula: "24536024", codigo: "B11", nombre: "ALBERTO LUIS OSUNA SALAZAR" },
  { cedula: "24620066", codigo: "B13", nombre: "YULETZYS CORAIMA GARCIA" },
  { cedula: "24904093", codigo: "B14", nombre: "LARYSA NOHEMI OCHOA SUAREZ" },
  { cedula: "25135646", codigo: "B15", nombre: "OBERSY MARIBI TORRES CARRASCO" },
  { cedula: "25275750", codigo: "B17", nombre: "HEILYN ISAMAR JIMENEZ HERRERA" },
  { cedula: "25313685", codigo: "B12", nombre: "JOSE JESUS RIVAS LEON" },
  { cedula: "25359736", codigo: "B04", nombre: "CARLOS EDUARDO PINEDA ROMERO" },
  { cedula: "25429284", codigo: "B19", nombre: "JESUS ALEJANDRO ALFARO" },
  { cedula: "25512867", codigo: "B21", nombre: "MARIA JOSE RAMIREZ RAMIREZ" },
  { cedula: "25617176", codigo: "B23", nombre: "CESAR EDUARDO RIVAS APONTE" },
  { cedula: "25882926", codigo: "B24", nombre: "MAGDANIEL FABIAN MENDOZA DABOIN" },
  { cedula: "26033114", codigo: "B25", nombre: "LAZARO ANTONIO EVANS ZAMBRANO" },
  { cedula: "26037693", codigo: "B22", nombre: "MAIREF MILAGRO CARICO MOSQUEDA" },
  { cedula: "26083254", codigo: "B27", nombre: "DISRAEL JOHANDRI EMAYACU VELASQUEZ" },
  { cedula: "26920181", codigo: "B26", nombre: "JOSE AURELIO MEZA PENA" },
  { cedula: "27226778", codigo: "B18", nombre: "VALERIA JOSE DEL VALLE MAITA GUAIQUIRIAN" },
  { cedula: "28345219", codigo: "B28", nombre: "JOSE FRANCISCO MORAO MUJICA" },
  { cedula: "29642712", codigo: "B29", nombre: "LUIS ENRIQUE MALAVE RODRIGUEZ" },
  { cedula: "29892915", codigo: "B30", nombre: "YANIS ENRIQUE CALZADA LEON" },
  { cedula: "30085918", codigo: "B31", nombre: "KENDRY FERNANDO GIL ALVARADO" },
  { cedula: "30091500", codigo: "B33", nombre: "ANGELICA YESIMAR NUNEZ CEDENO" },
  { cedula: "30099241", codigo: "B34", nombre: "ARYHELIS BEATRIZ BRICENO AZUAJE" },
  { cedula: "30200909", codigo: "B20", nombre: "DIONIVER ROGER MEDINA MORENO" },
  { cedula: "30450365", codigo: "B16", nombre: "MARIA VICTORIA RODRIGUEZ DAMAS" },
  { cedula: "31663174", codigo: "B35", nombre: "RUBEN DAVID PINA PEREZ" },
  { cedula: "31847450", codigo: "B32", nombre: "ALCIDES JOSE GONZALEZ LAGUNA" },
];

/** Alternativas OCR por si la cédula del PDF no coincide exactamente. */
const ALIASES: Record<string, string[]> = {
  "24809009": ["24803009"],
  "25882926": ["25682928", "25682926"],
};

const prisma = new PrismaClient();

async function main() {
  const convocatoria = await prisma.convocatoria.findFirst({
    where: { activa: true },
    select: { id: true, codigo: true, nombre: true },
  });
  if (!convocatoria) {
    console.error("No hay convocatoria activa.");
    process.exit(1);
  }
  console.log(`Convocatoria: ${convocatoria.codigo} — ${convocatoria.nombre}`);

  let updated = 0;
  let unchanged = 0;
  const missing: string[] = [];
  const conflicts: string[] = [];

  for (const row of MAPA) {
    const codigo = normalizarCodigoBinomio(row.codigo);
    if (!codigo) {
      conflicts.push(`${row.cedula}: código inválido ${row.codigo}`);
      continue;
    }

    const candidates = [row.cedula, ...(ALIASES[row.cedula] ?? [])];
    const aspirante = await prisma.aspirante.findFirst({
      where: {
        convocatoriaId: convocatoria.id,
        deletedAt: null,
        cedula: { in: candidates },
      },
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        codigoBinomio: true,
      },
    });

    if (!aspirante) {
      missing.push(`${row.cedula} (${row.nombre}) → ${codigo}`);
      continue;
    }

    if (aspirante.codigoBinomio === codigo) {
      unchanged += 1;
      continue;
    }

    try {
      await prisma.aspirante.update({
        where: { id: aspirante.id },
        data: { codigoBinomio: codigo },
      });
      updated += 1;
      console.log(`OK ${aspirante.cedula} → ${codigo} (${aspirante.nombres} ${aspirante.apellidos})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      conflicts.push(`${aspirante.cedula} → ${codigo}: ${msg}`);
    }
  }

  console.log("\n--- Resumen ---");
  console.log(`Actualizados: ${updated}`);
  console.log(`Sin cambio:   ${unchanged}`);
  console.log(`No hallados:  ${missing.length}`);
  for (const m of missing) console.log(`  - ${m}`);
  console.log(`Conflictos:   ${conflicts.length}`);
  for (const c of conflicts) console.log(`  - ${c}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
