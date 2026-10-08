/**
 * Catálogo de transcripciones para la Orden del Día.
 *
 * Extender: agregue entradas a `TRANSCRIPCIONES_LIBERTADOR`,
 * `TRANSCRIPCIONES_COMANDANTE` o `TRANSCRIPCIONES_LEY` (mín. 31 por categoría
 * para cubrir un mes sin repeticiones). Cada ítem necesita `id` estable.
 *
 * Preferir textos largos (2–4 oraciones / artículo desarrollado) para que
 * la sección A. TRANSCRIPCIONES llene la hoja carta.
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
  /** Texto de la cita o artículo (sin comillas; el PDF aplica formato APA). */
  texto: string;
  /**
   * Referencia APA (7.ª ed.), p. ej. Simón Bolívar.
   */
  atribucion?: string;
};

export const TITULO_LIBERTADOR = "PENSAMIENTO DEL LIBERTADOR";
export const TITULO_COMANDANTE = "PENSAMIENTO DEL COMANDANTE SUPREMO";
export const TITULO_LEY =
  "LEY DE DISCIPLINA MILITAR, TÍTULO I CAPÍTULO I DE LAS DISPOSICIONES FUNDAMENTALES.";

const APA_LEY =
  "Ley de Disciplina Militar.";

export const TRANSCRIPCIONES_LIBERTADOR: readonly Transcripcion[] = [
  {
    id: "bolivar-01",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Moral y luces son los polos de una República; moral y luces son nuestras primeras necesidades. Eduquemos al pueblo y formemos su carácter; sólo así la libertad dejará de ser un nombre vano y se convertirá en el principio de la prosperidad nacional.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-02",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Un pueblo ignorante es instrumento ciego de su propia destrucción; la ambición y la intriga usurpan el poder de los Estados donde no hay ilustración. La instrucción pública es el primer deber del gobierno republicano y el más seguro baluarte de la libertad.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-03",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El arte de vencer se aprende en las derrotas. No desmayemos ante la adversidad: cada reveses de la guerra y de la política deben servirnos de lección; el valor perseverante convierte los obstáculos en peldaños de la victoria.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-04",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La libertad no puede ser asegurada sin virtud. Un pueblo corrompido no merece ni puede conservar la independencia; la República exige ciudadanos honestos, soldados disciplinados y magistrados justos que antepongan el bien común a todo interés particular.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-05",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Es más difícil mantener el equilibrio de la libertad que soportar el peso de la tiranía. La libertad ilimitada termina en despotismo; por eso las leyes, la disciplina y la virtud pública son el freno necesario de todo pueblo que aspira a ser libre de verdad.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-06",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La justicia es la reina de las virtudes republicanas. Sin ella, el gobierno no es más que una usurpación y la sociedad un campo de conflictos. Que cada ciudadano encuentre en las instituciones el amparo de sus derechos y el castigo de sus faltas.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-07",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La unidad de nuestros pueblos no es simple quimera de los hombres, sino irrevocable decreto del destino. Divididos seremos débiles; unidos, formaremos una nación capaz de resistir cualquier amenaza exterior y de consolidar la independencia americana.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-08",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El sistema de gobierno más perfecto es aquel que produce mayor suma de felicidad posible, mayor suma de seguridad social y mayor suma de estabilidad política. No busquemos modelos ajenos a nuestra realidad: construyamos instituciones propias, firmes y justas, dignas de un pueblo libre.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-09",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La gloria está en ser grande y en ser útil. No basta con vencer en los campos de batalla; es preciso después gobernar con sabiduría, educar a la juventud y dejar a la patria instituciones sólidas que sobrevivan a los hombres y a las pasiones del momento.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-10",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Juramos delante de ustedes no dejar las armas hasta no ver libre a todo el Continente. La independencia de América es obra de la providencia y de la voluntad de los pueblos; nuestro deber es sostenerla con constancia, honor y sacrificio.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-11",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La educación formará el carácter moral de los pueblos. Un hombre sin instrucción es un instrumento peligroso; un pueblo ilustrado es invencible. Invertir en la formación de la juventud es invertir en la duración misma de la República.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-12",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Si la naturaleza se opone, lucharemos contra ella y haremos que nos obedezca. Ningún obstáculo —montañas, ríos, desiertos ni ejércitos— debe detener a quien pelea por la libertad de su patria y por la dignidad de sus hermanos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-13",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La patria es el altar mayor al que debemos sacrificarlo todo. El amor a la tierra que nos vio nacer, el respeto a sus leyes y la defensa de su independencia son deberes sagrados que ningún ciudadano consciente puede eludir.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-14",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Más cuesta mantener el equilibrio de la libertad que sufrir el peso de la tiranía. Por eso la disciplina, el orden y la subordinación a la ley no son enemigos de la libertad, sino sus verdaderos guardianes.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-15",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El soldado de la libertad no puede ser el esclavo del poder. Su espada defiende al pueblo, no oprime al ciudadano; su lealtad es a la República y a la Constitución, no a la ambición de ningún hombre.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-16",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La independencia de América es obra de la providencia y de la voluntad de los pueblos. Nosotros no somos más que instrumentos de esa causa grande; nuestra obligación es servirla con desinterés, valor y perseverancia hasta el fin.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-17",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Las naciones marchan hacia su grandeza al mismo paso que camina su educación. Sin escuelas, sin maestros y sin virtudes cívicas, la independencia se reduce a un cambio de amos; con instrucción, el pueblo se hace dueño de su destino.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-18",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La fuerza del pueblo todo lo puede cuando actúa unida y consciente de sus derechos. Dividido, el pueblo es presa fácil de la tiranía; organizado, es el más poderoso de los ejércitos y el más legítimo de los soberanos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-19",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "Combatir por la libertad es combatir por la justicia. No basta expulsar al opresor extranjero; es preciso edificar después un orden social donde la igualdad ante la ley y el respeto a la dignidad humana sean principios irrevocables.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-20",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El valor, la constancia y la virtud son los únicos que pueden salvar a la República. Las armas conquistan el territorio; las virtudes conservan la libertad. Sin ellas, toda victoria es efímera y toda Constitución, papel muerto.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-21",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La disciplina es el alma de los ejércitos. Sin ella no hay victoria posible, ni orden en las filas, ni respeto al mando. El soldado disciplinado es el pilar de la defensa nacional y el ejemplo de obediencia consciente a la ley.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-22",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La honradez es la primera virtud del ciudadano y la más necesaria en el hombre público. Quien maneja los intereses de la patria debe hacerlo con manos limpias; la corrupción destruye más rápido una República que el enemigo más poderoso.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-23",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La igualdad política no es otra cosa que el derecho a participar en el gobierno y a ser juzgado por las mismas leyes. Sin igualdad ante la ley, la democracia se convierte en privilegio de unos pocos y en humillación de la mayoría.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-24",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La América toda estará libre el día que lo esté Venezuela. Nuestra causa no es estrecha ni local: es la causa de un continente entero que reclama su derecho a gobernarse por sí mismo y a vivir en dignidad.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-25",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La unión es nuestra fuerza; la discordia, nuestra ruina. Mientras permanezcamos unidos en torno a la patria y a sus instituciones, seremos respetados; si nos dividimos por ambiciones mezquinas, seremos juguete de enemigos internos y externos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-26",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El amor a la patria es el primer deber del ciudadano. Ese amor se manifiesta en el trabajo diario, en el respeto a las leyes, en la defensa del territorio y en la disposición de sacrificar el interés personal cuando lo exige el bien de la República.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-27",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La victoria no es siempre de los más fuertes, sino de los más perseverantes. El que no se rinde ante el cansancio ni ante el desaliento acaba por imponer su voluntad; la constancia es, en la guerra y en la vida pública, la madre de los triunfos duraderos.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-28",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La libertad de un pueblo no se mendiga: se conquista. Ningún poder extranjero ni ninguna oligarquía entrega derechos por piedad; la independencia y la justicia social se ganan con organización, valor y firmeza de principios.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-29",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La Constitución debe ser un freno a la anarquía y un dique a la tiranía. Ella fija los límites del poder y garantiza los derechos del pueblo; sin Constitución respetada, no hay República ni seguridad para el ciudadano.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-30",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La verdadera soberanía reside en el pueblo. Los gobiernos son depositarios temporales de esa soberanía; cuando traicionan el mandato popular, pierden su legitimidad. El pueblo consciente es el único juez definitivo de sus gobernantes.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-31",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La República debe ser el asilo de la virtud y el terror del vicio. Que el mérito sea premiado, que la falta sea corregida y que nadie se cree por encima de la ley: sólo así la patria será digna del sacrificio de sus libertadores.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-32",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "La patria no se hace con palabras, sino con hechos. Discursos elocuentes no levantan cuarteles, no instruyen tropas ni alimentan al pueblo; el verdadero patriotismo se mide en el cumplimiento del deber y en el servicio silencioso a la nación.",
    atribucion: "Simón Bolívar.",
  },
  {
    id: "bolivar-33",
    categoria: "libertador",
    titulo: TITULO_LIBERTADOR,
    texto:
      "El que sirve a la revolución pliega su interés particular al interés de todos. No hay causa grande sin renuncia personal; el hombre público debe olvidarse de sí mismo cuando la salvación de la patria lo reclama.",
    atribucion: "Simón Bolívar.",
  },
];

export const TRANSCRIPCIONES_COMANDANTE: readonly Transcripcion[] = [
  {
    id: "chavez-01",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El único camino para que haya Patria es el socialismo, no hay otro camino. O construimos una sociedad de iguales, solidaria y soberana, o seguiremos bajo el yugo de quienes convierten al pueblo en mercancía. La patria verdadera se edifica con justicia social.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-02",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La patria es sagrada, la patria es de todos. No pertenece a una élite ni a un partido: pertenece al pueblo trabajador, a los soldados, a los campesinos y a la juventud que estudia y lucha. Quien ame de verdad a Venezuela debe servirla sin descanso.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-03",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "No hay revolución sin disciplina, ni disciplina sin conciencia. La disciplina revolucionaria no nace del miedo, sino del convencimiento profundo de que servir al pueblo es el más alto honor. Un soldado consciente es más fuerte que mil bayonetas sin ideal.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-04",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El soldado venezolano es pueblo en uniforme. No es casta aparte ni fuerza de ocupación sobre su propia gente: es hijo del pueblo, servidor del pueblo y defensor de la soberanía. Quien olvida eso traiciona el juramento militar.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-05",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La educación es el arma más poderosa para transformar la sociedad. Un pueblo instruido no se deja engañar ni esclavizar; por eso debemos formar oficiales y ciudadanos con pensamiento crítico, ética pública y amor profundo a la patria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-06",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La soberanía reside intransferiblemente en el pueblo. Ningún gobierno, ninguna fuerza extranjera y ninguna oligarquía pueden disponer de ella. Nuestro deber es defender esa soberanía en lo político, lo económico, lo militar y lo cultural.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-07",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Patria, socialismo o muerte: esa es la consigna de los hombres y mujeres libres. No es una frase de ocasión, sino un compromiso de vida con la independencia, con la justicia social y con la dignidad de nuestro pueblo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-08",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La independencia no se negocia; la independencia se defiende. Cada día hay que conquistarla de nuevo en el estudio, en el trabajo productivo, en la vigilancia del territorio y en la unidad del pueblo con su Fuerza Armada.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-09",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El amor a la patria se demuestra con trabajo, estudio y compromiso. No basta cantar el himno: hay que madrugar al cuartel, cumplir la guardia, formar el carácter y poner el talento al servicio de Venezuela.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-10",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Un pueblo consciente es un pueblo invencible. Cuando las masas conocen su historia, sus derechos y su fuerza, ninguna potencia puede doblegarlas. La conciencia patriótica es el verdadero escudo de la República.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-11",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La unidad es la clave de la victoria. Divididos, somos vulnerables; unidos en torno a Bolívar, a la Constitución y al pueblo, seremos capaces de enfrentar cualquier amenaza. Cuiden la unidad como se cuida la vida misma de la patria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-12",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La FANB es del pueblo y para el pueblo. Su razón de ser no es el privilegio de una cúpula, sino la defensa integral de la nación. Cada oficial debe vivir como servidor público y como hermano de los más humildes.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-13",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La dignidad no se vende ni se arrienda. Hay quienes cambian principios por comodidades; nosotros no. Prefiero morir de pie, con la frente en alto, antes que vivir de rodillas ante el imperio o ante el capital.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-14",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La revolución es pacífica, pero armada: armada de conciencia y de pueblo. No buscamos la violencia; buscamos la justicia. Y para defenderla necesitamos ideas claras, organización popular y una fuerza armada leal a la patria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-15",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El que no ama a la patria no puede llamarse venezolano de verdad. El amor a Venezuela se prueba en la lealtad diaria, en el rechazo a la corrupción y en la disposición de darlo todo cuando la República lo necesite.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-16",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La justicia social es el corazón de la democracia verdadera. ¿De qué sirve votar si el pueblo pasa hambre, si no hay escuelas ni hospitales? Democracia sin justicia es una farsa; con justicia, es la forma más alta de libertad.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-17",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Estudien, formen su carácter y sirvan a la República con honradez. El oficial del siglo XXI debe ser profesional, ético y profundamente humano. La ignorancia y la soberbia son enemigos tan peligrosos como cualquier amenaza exterior.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-18",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La patria nos llama a la unidad, al trabajo y a la defensa de lo nuestro. No hay tiempo para el desaliento ni para la indiferencia: cada venezolano consciente debe aportar su esfuerzo en la construcción de una nación soberana y justa.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-19",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Sin moral no hay revolución que se sostenga. Pueden ganarse batallas políticas, pero si corrompe el corazón de los cuadros, todo se derrumba. La ética, la austeridad y el ejemplo personal son el combustible de la causa bolivariana.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-20",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El compromiso con el pueblo es el compromiso con la historia. No trabajamos para una foto ni para un cargo: trabajamos para que las generaciones futuras hereden una Venezuela libre, educada y dueña de sus destinos.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-21",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La soberanía alimentaria, energética y militar son pilares de la independencia. Quien depende del extranjero para comer, para alumbrar o para defenderse, no es libre. Construyamos capacidad propia en cada uno de esos frentes.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-22",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Quien sirva al pueblo con lealtad nunca estará solo. El pueblo reconoce a sus verdaderos servidores y los acompaña en las horas difíciles. El egoísmo aísla; el servicio generoso construye una familia nacional indestructible.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-23",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La disciplina revolucionaria nace del convencimiento, no del miedo. Ordenamos y obedecemos porque sabemos que sin orden no hay victoria ni institución. El mando debe ser ejemplar; la obediencia, consciente y digna.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-24",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Venezuela es de Bolívar, y Bolívar es del pueblo. Su pensamiento no es museo: es brújula viva para la acción. Cada generación debe reencontrarse con el Libertador y continuar su obra de emancipación y justicia.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-25",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La esperanza se construye todos los días con trabajo y firmeza. No esperemos milagros: organicémonos, estudiemos, produzcamos y defendamos lo conquistado. La fe en la patria se demuestra en la constancia.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-26",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El oficial debe ser ejemplo de honor, estudio y servicio. Su autoridad moral vale más que cualquier grado. Si el jefe es justo, trabajador y cercano al personal, la unidad entera se eleva; si es indigno, arrastra a todos hacia abajo.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-27",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La patria no se entrega: se defiende con ideas y con voluntad. Hay batallas de opinión, batallas económicas y batallas territoriales. En todas ellas debe estar presente el espíritu bolivariano de resistencia y de victoria.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-28",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La conciencia patriótica es el escudo de la República. Un pueblo dormido es fácil de conquistar; un pueblo despierto, organizado y leal a su historia es imposible de doblegar. Despertemos cada día al servicio de Venezuela.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-29",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "El pueblo organizado es la mayor fuerza de la nación. Ni el oro ni las armas extranjeras vencen a un pueblo unido. Por eso la organización popular y militar debe marchar junta, como un solo cuerpo al servicio de la soberanía.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-30",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La lealtad a la Constitución es lealtad a la patria. No hay disciplina militar verdadera fuera del marco constitucional. El juramento de armas es, ante todo, un juramento de fidelidad a la República Bolivariana de Venezuela.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-31",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Formar oficiales es formar servidores de la República. Cada aula, cada instrucción y cada guardia debe sembrar valores de honor, solidaridad y amor al pueblo. El futuro de la FANB se decide en la calidad moral de quienes hoy se forman.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-32",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "La revolución bolivariana es obra colectiva del pueblo venezolano. Ningún hombre solo hace la historia: la hace el pueblo cuando se organiza, cuando estudia y cuando se niega a renunciar a su dignidad. Sigamos siendo ese pueblo en marcha.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
  {
    id: "chavez-33",
    categoria: "comandante",
    titulo: TITULO_COMANDANTE,
    texto:
      "Con Bolívar y el pueblo, siempre venceremos. Esa certeza no es fanfarronería: es la síntesis de nuestra historia. Cuando la causa es justa y el pueblo está despierto, la victoria es sólo cuestión de tiempo y de firmeza.",
    atribucion: "Hugo Rafael Chávez Frías.",
  },
];

export const TRANSCRIPCIONES_LEY: readonly Transcripcion[] = [
  {
    id: "ley-01",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 1. La presente Ley tiene por objeto establecer las normas relativas a la disciplina militar, las faltas, las sanciones y el procedimiento disciplinario aplicables al personal militar de la Fuerza Armada Nacional Bolivariana, a fin de preservar el orden, la subordinación, la eficacia del servicio y el prestigio de la institución armada.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-02",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 2. Las disposiciones establecidas en la presente Ley se aplican al personal militar en situación de actividad de la Fuerza Armada Nacional Bolivariana, así como al personal de la Milicia Bolivariana en situación de movilización. Quienes ejerzan mando o función de servicio quedan sujetos a sus deberes y responsabilidades disciplinarias.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-03",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 3. La disciplina militar es el conjunto de deberes y obligaciones que aseguran la subordinación, la obediencia, el respeto y el cumplimiento del deber, indispensables para el funcionamiento de la institución armada. Sin disciplina no hay unidad de mando ni capacidad operativa para la defensa de la Nación.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-04",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 4. Todo militar debe observar una conducta acorde con la dignidad de su condición, tanto en el servicio como fuera de él, y cuidar el prestigio de la Fuerza Armada Nacional Bolivariana. Su comportamiento público y privado debe ser ejemplo de honor, sobriedad y respeto a las leyes de la República.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-05",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 5. La obediencia militar se debe a las órdenes legítimas impartidas por el superior jerárquico, dentro de las atribuciones de su cargo y conforme a la Constitución y las leyes. El subordinado ejecutará con exactitud y diligencia lo ordenado, sin perjuicio de informar irregularidades por los canales regulares.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-06",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 6. El personal militar está obligado a cumplir con exactitud, diligencia y lealtad las funciones inherentes a su grado, cargo y especialidad. El abandono de deberes, la negligencia y el incumplimiento injustificado constituyen faltas que afectan la eficacia del servicio y la confianza en la institución.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-07",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 7. El respeto mutuo entre superiores y subordinados constituye un principio esencial de la convivencia militar y del buen servicio. El mando se ejerce con firmeza y justicia; la subordinación, con dignidad. Quedan prohibidos los tratos vejatorios, la humillación y el abuso de autoridad.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-08",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 8. Queda prohibido el abuso de autoridad, los tratos degradantes y cualquier acto que atente contra la dignidad de la persona humana en el ámbito militar. La disciplina no se confunde con el arbitrio: se funda en la ley, en el ejemplo del jefe y en el respeto a los derechos constitucionales.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-09",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 9. El personal militar debe conservar y emplear correctamente el armamento, municiones, equipos, vehículos, uniformes y demás bienes asignados al servicio. El descuido, el uso indebido o la pérdida por negligencia de dichos bienes genera responsabilidad disciplinaria, sin perjuicio de otras responsabilidades legales.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-10",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 10. La inasistencia injustificada al servicio, el abandono del puesto y la negligencia en el cumplimiento del deber constituyen faltas disciplinarias. El personal de guardia, comisión o servicio permanente debe permanecer alerta y no ausentarse sin autorización del superior competente.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-11",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 11. Las faltas se clasifican en leves, graves y gravísimas, conforme a la naturaleza del hecho, sus circunstancias y las consecuencias para el servicio. La graduación de la falta orienta la sanción aplicable, siempre con observancia de los principios de legalidad, proporcionalidad y debido proceso.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-12",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 12. Son faltas leves aquellas que, sin afectar de manera significativa el servicio, vulneran deberes de orden, presentación, puntualidad o cuidado de los bienes institucionales. Aun siendo leves, deben corregirse de inmediato para evitar que se conviertan en hábitos contrarios a la disciplina.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-13",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 13. Son faltas graves las que afectan el prestigio de la institución, la disciplina del cuerpo o la eficacia del servicio militar. En estos casos la sanción debe ser proporcional al daño causado y suficiente para restablecer el orden y el ejemplo dentro de la unidad.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-14",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 14. Son faltas gravísimas aquellas que atentan contra la seguridad de la nación, la integridad de la Fuerza Armada o los valores fundamentales de la disciplina militar. Tales faltas demandan actuación inmediata de la autoridad competente y el procedimiento correspondiente según esta Ley.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-15",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 15. Nadie puede ser sancionado sino por hechos tipificados como falta en la presente Ley y mediante el procedimiento legalmente establecido. Queda prohibida toda sanción arbitraria, secreta o contraria al derecho a la defensa del personal militar investigado.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-16",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 16. En la imposición de sanciones se observarán los principios de legalidad, proporcionalidad, tipicidad y debido proceso. La autoridad disciplinaria valorará las circunstancias del hecho, la reincidencia, las agravantes y atenuantes, y la finalidad correctiva de la medida.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-17",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 17. El superior jerárquico es responsable de mantener la disciplina en la unidad a su cargo y de corregir oportunamente las faltas de sus subordinados. La omisión injustificada en el ejercicio de esta responsabilidad puede constituir, a su vez, falta disciplinaria.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-18",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 18. Todo militar tiene el deber de informar las irregularidades que conozca en el servicio, por los canales regulares y con la debida formalidad. El silencio cómplice, la ocultación de faltas o la denuncia falsa atentan contra la integridad institucional y serán sancionados conforme a esta Ley.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-19",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 19. La presentación personal, el porte del uniforme y el saludo militar son expresiones visibles de la disciplina y del espíritu de cuerpo. El personal debe cuidar su aspecto, el estado del uniforme y el cumplimiento de las normas de cortesía militar dentro y fuera de la unidad.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-20",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 20. Queda prohibido el consumo de bebidas alcohólicas o sustancias ilícitas en servicio, así como presentarse bajo sus efectos al cumplimiento del deber. Tales conductas comprometen la seguridad del personal, la operatividad de la unidad y el prestigio de la Fuerza Armada.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-21",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 21. El personal en comisión de servicio o de guardia debe permanecer alerta y no abandonar su puesto sin autorización del superior competente. La guardia es un acto de confianza institucional; su incumplimiento afecta la seguridad de la instalación y la continuidad del servicio.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-22",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 22. La conservación de los documentos, sellos y correspondencia oficial es deber de todo militar que tenga acceso a ellos por razón de su cargo. La pérdida, alteración o divulgación indebida de documentación oficial constituye falta, sin perjuicio de otras responsabilidades.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-23",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 23. El uso indebido de la autoridad o del cargo para obtener beneficios personales constituye falta disciplinaria. El mando militar es un servicio a la República; emplearlo en provecho propio o de terceros traiciona la ética del oficial y el juramento de armas.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-24",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 24. La subordinación no exime de responsabilidad cuando se ejecuten órdenes manifiestamente ilegales o contrarias a la Constitución. Todo militar debe conocer los límites del deber de obediencia y actuar conforme a la legalidad democrática de la República.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-25",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 25. El personal militar debe guardar reserva sobre asuntos del servicio cuya divulgación pueda afectar la seguridad o el buen nombre de la institución. La discreción profesional es parte esencial de la disciplina y de la confianza depositada en cada militar.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-26",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 26. Las sanciones disciplinarias tienen finalidad correctiva y pedagógica, sin perjuicio de la responsabilidad penal o civil que pudiere corresponder. Su objeto es enmendar la conducta, restaurar el orden y prevenir nuevas faltas dentro de la institución.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-27",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 27. El procedimiento disciplinario garantiza el derecho a la defensa, a ser oído y a presentar pruebas en los términos previstos en esta Ley. Ninguna sanción será firme sin que el investigado haya tenido oportunidad real de ejercer sus derechos procesales.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-28",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 28. La reincidencia y las circunstancias agravantes o atenuantes serán valoradas al momento de imponer la sanción correspondiente. La autoridad disciplinaria motivará su decisión de forma clara, fundada y proporcional a la falta acreditada.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-29",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 29. El personal militar debe contribuir al mantenimiento del orden interno de la unidad y al respeto de las normas de convivencia castrense. La solidaridad, el compañerismo y el respeto mutuo fortalecen el espíritu de cuerpo y la eficacia colectiva del servicio.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-30",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 30. La puntualidad en el inicio y término de las jornadas, guardias y servicios es un deber inexcusable del personal militar. La impuntualidad reiterada afecta la planificación del mando, la equidad entre compañeros y la continuidad operativa de la unidad.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-31",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 31. El incumplimiento de las normas de seguridad en el manejo de armas, municiones y explosivos constituye falta, sin perjuicio de otras responsabilidades. La seguridad del personal y de las instalaciones es prioridad permanente de todo militar en actividad.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-32",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 32. Todo militar debe mantener actualizados sus conocimientos profesionales y participar en las actividades de instrucción que disponga el comando. La formación continua es condición de eficacia, seguridad y progreso institucional de la Fuerza Armada.",
    atribucion: APA_LEY,
  },
  {
    id: "ley-33",
    categoria: "ley_disciplina",
    titulo: TITULO_LEY,
    texto:
      "Artículo 33. La lealtad a la República, a la Constitución y a la Fuerza Armada Nacional Bolivariana es deber permanente del personal militar. Dicha lealtad se expresa en el cumplimiento diario del servicio, en la defensa de la soberanía y en el rechazo a toda conducta que menoscabe la institución.",
    atribucion: APA_LEY,
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
