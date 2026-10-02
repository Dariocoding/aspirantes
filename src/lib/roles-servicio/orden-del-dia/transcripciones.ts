/**
 * Catálogo de transcripciones para la Orden del día.
 *
 * Extender: agregue entradas a `TRANSCRIPCIONES_LIBERTADOR`,
 * `TRANSCRIPCIONES_COMANDANTE` o `TRANSCRIPCIONES_LEY` (mín. 31 por categoría
 * para cubrir un mes sin repeticiones). Cada ítem necesita `id` estable.
 */

export type TranscripcionCategoria =
  | "libertador"
  | "comandante"
  | "ley_disciplina";

export type Transcripcion = {
  id: string;
  categoria: TranscripcionCategoria;
  /** Título en mayúsculas que aparece en la orden (p. ej. PENSAMIENTO DEL LIBERTADOR). */
  titulo: string;
  texto: string;
  atribucion?: string;
};

export const TITULO_LIBERTADOR = "PENSAMIENTO DEL LIBERTADOR";
export const TITULO_COMANDANTE = "PENSAMIENTO DEL COMANDANTE SUPREMO";
export const TITULO_LEY =
  "LEY DE DISCIPLINA MILITAR, TÍTULO I CAPÍTULO I DE LAS DISPOSICIONES FUNDAMENTALES.";

export const TRANSCRIPCIONES_LIBERTADOR: readonly Transcripcion[] = [
  {
    id: "bolivar-01",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Moral y luces son los polos de una república; moral y luces son nuestras primeras necesidades.",
    atribucion: "(Discurso ante el Congreso de Angostura, 15 de febrero de 1819). Simón Bolívar.",
  },
  {
    id: "bolivar-02",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Un pueblo ignorante es instrumento ciego de su propia destrucción.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-03",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El arte de vencer se aprende en las derrotas.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-04",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La libertad no puede ser asegurada sin virtud.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-05",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Es más difícil mantener el equilibrio de la libertad que soportar el peso de la tiranía.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-06",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La justicia es la reina de las virtudes republicanas.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-07",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La unidad de nuestros pueblos no es simple quimera de los hombres, sino irrevocable decreto del destino.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-08",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El sistema de gobierno más perfecto es aquel que produce mayor suma de felicidad posible, mayor suma de seguridad social y mayor suma de estabilidad política.",
    atribucion: "(Discurso de Angostura). Simón Bolívar.",
  },
  {
    id: "bolivar-09",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La gloria está en ser grande y en ser útil.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-10",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Juramos delante de ustedes no dejar las armas hasta no ver libre a todo el Continente.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-11",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La educación formará el carácter moral de los pueblos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-12",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Si la naturaleza se opone, lucharemos contra ella y haremos que nos obedezca.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-13",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La patria es el altar mayor al que debemos sacrificarlo todo.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-14",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Más cuesta mantener el equilibrio de la libertad que sufrir el peso de la tiranía.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-15",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El soldado de la libertad no puede ser el esclavo del poder.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-16",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La independencia de América es obra de la providencia y de la voluntad de los pueblos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-17",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Las naciones marchan hacia su grandeza al mismo paso que camina su educación.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-18",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La fuerza del pueblo todo lo puede.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-19",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "Combatir por la libertad es combatir por la justicia.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-20",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El valor, la constancia y la virtud son los únicos que pueden salvar a la República.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-21",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La disciplina es el alma de los ejércitos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-22",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La honradez es la primera virtud del ciudadano.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-23",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La igualdad política no es otra cosa que el derecho a participar en el gobierno.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-24",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La América toda estará libre el día que lo esté Venezuela.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-25",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La unión es nuestra fuerza; la discordia, nuestra ruina.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-26",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El amor a la patria es el primer deber del ciudadano.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-27",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La victoria no es siempre de los más fuertes, sino de los más perseverantes.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-28",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La libertad de un pueblo no se mendiga: se conquista.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-29",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La Constitución debe ser un freno a la anarquía y un dique a la tiranía.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-30",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La verdadera soberanía reside en el pueblo.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-31",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La República debe ser el asilo de la virtud y el terror del vicio.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-32",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "La patria no se hace con palabras, sino con hechos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-33",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto: "El que sirve a la revolución pliega su interés particular al interés de todos.",
    atribucion: "Simón Bolívar.",
  },
];

export const TRANSCRIPCIONES_COMANDANTE: readonly Transcripcion[] = [
  {
    id: "chavez-01",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El único camino para que haya Patria es el socialismo, no hay otro camino.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-02",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La patria es sagrada, la patria es de todos.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-03",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "No hay revolución sin disciplina, ni disciplina sin conciencia.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-04",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El soldado venezolano es pueblo en uniforme.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-05",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La educación es el arma más poderosa para transformar la sociedad.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-06",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La soberanía reside intransferiblemente en el pueblo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-07",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Patria, socialismo o muerte: esa es la consigna de los hombres y mujeres libres.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-08",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La independencia no se negocia; la independencia se defiende.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-09",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El amor a la patria se demuestra con trabajo, estudio y compromiso.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-10",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Un pueblo consciente es un pueblo invencible.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-11",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La unidad es la clave de la victoria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-12",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La FANB es del pueblo y para el pueblo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-13",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La dignidad no se vende ni se arrienda.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-14",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La revolución es pacífica, pero armada: armada de conciencia y de pueblo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-15",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El que no ama a la patria no puede llamarse venezolano de verdad.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-16",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La justicia social es el corazón de la democracia verdadera.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-17",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Estudien, formen su carácter y sirvan a la República con honradez.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-18",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La patria nos llama a la unidad, al trabajo y a la defensa de lo nuestro.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-19",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Sin moral no hay revolución que se sostenga.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-20",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El compromiso con el pueblo es el compromiso con la historia.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-21",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La soberanía alimentaria, energética y militar son pilares de la independencia.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-22",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Quien sirva al pueblo con lealtad nunca estará solo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-23",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La disciplina revolucionaria nace del convencimiento, no del miedo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-24",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Venezuela es de Bolívar, y Bolívar es del pueblo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-25",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La esperanza se construye todos los días con trabajo y firmeza.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-26",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El oficial debe ser ejemplo de honor, estudio y servicio.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-27",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La patria no se entrega: se defiende con ideas y con voluntad.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-28",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La conciencia patriótica es el escudo de la República.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-29",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "El pueblo organizado es la mayor fuerza de la nación.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-30",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La lealtad a la Constitución es lealtad a la patria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-31",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Formar oficiales es formar servidores de la República.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-32",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "La revolución bolivariana es obra colectiva del pueblo venezolano.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-33",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto: "Con Bolívar y el pueblo, siempre venceremos.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
];

export const TRANSCRIPCIONES_LEY: readonly Transcripcion[] = [
  {
    id: "ley-01",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 2. Las disposiciones establecidas en la presente Ley se aplican al personal militar en situación de actividad de la Fuerza Armada Nacional Bolivariana, así como al personal de la Milicia Bolivariana en situación de movilización.",
  },
  {
    id: "ley-02",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 1. La presente Ley tiene por objeto establecer las normas relativas a la disciplina militar, las faltas, sanciones y el procedimiento disciplinario aplicables al personal militar de la Fuerza Armada Nacional Bolivariana.",
  },
  {
    id: "ley-03",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 3. La disciplina militar es el conjunto de deberes y obligaciones que aseguran la subordinación, la obediencia, el respeto y el cumplimiento del deber, indispensables para el funcionamiento de la institución armada.",
  },
  {
    id: "ley-04",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 4. Todo militar debe observar una conducta acorde con la dignidad de su condición, tanto en el servicio como fuera de él, y cuidar el prestigio de la Fuerza Armada Nacional Bolivariana.",
  },
  {
    id: "ley-05",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 5. La obediencia militar se debe a las órdenes legítimas impartidas por el superior jerárquico, dentro de las atribuciones de su cargo y conforme a la Constitución y las leyes.",
  },
  {
    id: "ley-06",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 6. El personal militar está obligado a cumplir con exactitud, diligencia y lealtad las funciones inherentes a su grado, cargo y especialidad.",
  },
  {
    id: "ley-07",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 7. El respeto mutuo entre superiores y subordinados constituye un principio esencial de la convivencia militar y del buen servicio.",
  },
  {
    id: "ley-08",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 8. Queda prohibido el abuso de autoridad, los tratos degradantes y cualquier acto que atente contra la dignidad de la persona humana en el ámbito militar.",
  },
  {
    id: "ley-09",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 9. El personal militar debe conservar y emplear correctamente el armamento, municiones, equipos, vehículos, uniformes y demás bienes asignados al servicio.",
  },
  {
    id: "ley-10",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 10. La inasistencia injustificada al servicio, el abandono del puesto y la negligencia en el cumplimiento del deber constituyen faltas disciplinarias.",
  },
  {
    id: "ley-11",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 11. Las faltas se clasifican en leves, graves y gravísimas, conforme a la naturaleza del hecho, sus circunstancias y las consecuencias para el servicio.",
  },
  {
    id: "ley-12",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 12. Son faltas leves aquellas que, sin afectar de manera significativa el servicio, vulneran deberes de orden, presentación, puntualidad o cuidado de los bienes institucionales.",
  },
  {
    id: "ley-13",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 13. Son faltas graves las que afectan el prestigio de la institución, la disciplina del cuerpo o la eficacia del servicio militar.",
  },
  {
    id: "ley-14",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 14. Son faltas gravísimas aquellas que atentan contra la seguridad de la nación, la integridad de la Fuerza Armada o los valores fundamentales de la disciplina militar.",
  },
  {
    id: "ley-15",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 15. Nadie puede ser sancionado sino por hechos tipificados como falta en la presente Ley y mediante el procedimiento legalmente establecido.",
  },
  {
    id: "ley-16",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 16. En la imposición de sanciones se observarán los principios de legalidad, proporcionalidad, tipicidad y debido proceso.",
  },
  {
    id: "ley-17",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 17. El superior jerárquico es responsable de mantener la disciplina en la unidad a su cargo y de corregir oportunamente las faltas de sus subordinados.",
  },
  {
    id: "ley-18",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 18. Todo militar tiene el deber de informar las irregularidades que conozca en el servicio, por los canales regulares y con la debida formalidad.",
  },
  {
    id: "ley-19",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 19. La presentación personal, el porte del uniforme y el saludo militar son expresiones visibles de la disciplina y del espíritu de cuerpo.",
  },
  {
    id: "ley-20",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 20. Queda prohibido el consumo de bebidas alcohólicas o sustancias ilícitas en servicio, así como presentarse bajo sus efectos al cumplimiento del deber.",
  },
  {
    id: "ley-21",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 21. El personal en comisión de servicio o de guardia debe permanecer alerta y no abandonar su puesto sin autorización del superior competente.",
  },
  {
    id: "ley-22",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 22. La conservación de los documentos, sellos y correspondencia oficial es deber de todo militar que tenga acceso a ellos por razón de su cargo.",
  },
  {
    id: "ley-23",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 23. El uso indebido de la autoridad o del cargo para obtener beneficios personales constituye falta disciplinaria.",
  },
  {
    id: "ley-24",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 24. La subordinación no exime de responsabilidad cuando se ejecuten órdenes manifiestamente ilegales o contrarias a la Constitución.",
  },
  {
    id: "ley-25",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 25. El personal militar debe guardar reserva sobre asuntos del servicio cuya divulgación pueda afectar la seguridad o el buen nombre de la institución.",
  },
  {
    id: "ley-26",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 26. Las sanciones disciplinarias tienen finalidad correctiva y pedagógica, sin perjuicio de la responsabilidad penal o civil que pudiere corresponder.",
  },
  {
    id: "ley-27",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 27. El procedimiento disciplinario garantiza el derecho a la defensa, a ser oído y a presentar pruebas en los términos previstos en esta Ley.",
  },
  {
    id: "ley-28",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 28. La reincidencia y las circunstancias agravantes o atenuantes serán valoradas al momento de imponer la sanción correspondiente.",
  },
  {
    id: "ley-29",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 29. El personal militar debe contribuir al mantenimiento del orden interno de la unidad y al respeto de las normas de convivencia castrense.",
  },
  {
    id: "ley-30",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 30. La puntualidad en el inicio y término de las jornadas, guardias y servicios es un deber inexcusable del personal militar.",
  },
  {
    id: "ley-31",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 31. El incumplimiento de las normas de seguridad en el manejo de armas, municiones y explosivos constituye falta, sin perjuicio de otras responsabilidades.",
  },
  {
    id: "ley-32",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 32. Todo militar debe mantener actualizados sus conocimientos profesionales y participar en las actividades de instrucción que disponga el comando.",
  },
  {
    id: "ley-33",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 33. La lealtad a la República, a la Constitución y a la Fuerza Armada Nacional Bolivariana es deber permanente del personal militar.",
  },
];

const POR_CATEGORIA: Record<TranscripcionCategoria, readonly Transcripcion[]> = {
  libertador: TRANSCRIPCIONES_LIBERTADOR,
  comandante: TRANSCRIPCIONES_COMANDANTE,
  ley_disciplina: TRANSCRIPCIONES_LEY,
};

/** Lista todas las transcripciones (útil para admin / futuras pantallas de edición). */
export function listTranscripciones(
  categoria?: TranscripcionCategoria,
): readonly Transcripcion[] {
  if (!categoria) {
    return [
      ...TRANSCRIPCIONES_LIBERTADOR,
      ...TRANSCRIPCIONES_COMANDANTE,
      ...TRANSCRIPCIONES_LEY,
    ];
  }
  return POR_CATEGORIA[categoria];
}

/** Mezcla determinista (Mulberry32) para un mes dado: sin repetición en los 31 días. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function permutarIndices(n: number, seed: number): number[] {
  const indices = Array.from({ length: n }, (_, i) => i);
  const rnd = mulberry32(seed);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices;
}

function seedMes(categoria: TranscripcionCategoria, anio: number, mes: number): number {
  const cat =
    categoria === "libertador" ? 1 : categoria === "comandante" ? 2 : 3;
  return anio * 1000 + mes * 10 + cat;
}

/**
 * Transcripción del día para una categoría.
 * En un mismo mes/año no se repite la misma entrada (si hay ≥ días del mes en el catálogo).
 */
export function transcripcionDelDia(
  categoria: TranscripcionCategoria,
  anio: number,
  mes: number,
  dia: number,
): Transcripcion {
  const catalogo = POR_CATEGORIA[categoria];
  if (catalogo.length === 0) {
    throw new Error(`Catálogo vacío para categoría ${categoria}`);
  }
  const diaClamped = Math.min(Math.max(1, dia), 31);
  const orden = permutarIndices(catalogo.length, seedMes(categoria, anio, mes));
  const indice = orden[(diaClamped - 1) % orden.length]!;
  return catalogo[indice]!;
}

export type TrioTranscripcionesDia = {
  libertador: Transcripcion;
  comandante: Transcripcion;
  ley: Transcripcion;
};

export function trioTranscripcionesDelDia(
  anio: number,
  mes: number,
  dia: number,
): TrioTranscripcionesDia {
  return {
    libertador: transcripcionDelDia("libertador", anio, mes, dia),
    comandante: transcripcionDelDia("comandante", anio, mes, dia),
    ley: transcripcionDelDia("ley_disciplina", anio, mes, dia),
  };
}
