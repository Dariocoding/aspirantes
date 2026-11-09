---
name: roles-servicio-equidad
description: Reparte roles de servicio con equidad hasta el viernes y aplica exclusiones fijas. Usar al montar, mover, equilibrar o revisar guardias, roles de servicio, comedor, cuartelero, baño, aula, enfermería o estacionamiento.
---

# Equidad de roles de servicio

El tramo que cuenta es del día 7 al viernes 13 de noviembre 2026. Lo anterior al 7 no suma carga. El 7 y el 8 se dejan como están. No crees marcas después del viernes 13. No abras localhost para comprobar el resultado: cuenta los días en los datos.

## Quién no monta

Estas personas no reciben ningún rol, aunque el día esté vacío o lleven cero guardias:

- José Angel Navas Vicuña
- Darío Alfonso Flores Montesinos
- Glorianny Luisana Salazar Muñoz
- Alcides José Gonzalez Laguna

## Enfermeros

Identifícalos por el título (`tituloUniversidad` contiene "enferm"), no por el rol de enfermería.

Pueden montar:

- guardia de baño
- cuartelero
- mantenimiento al aula
- el rol de enfermería

No pueden montar:

- comedor
- estacionamiento

Quien está en el rol de medicina puede, el mismo día, montar cuartelero, mantenimiento al aula o guardia de baño. Ese cruce no es un choque de guardia diurna. Comedor, inspección y una persona dos veces en el mismo rol sí chocan. El nocturno y el estacionamiento no entran en ese conteo.

Glorianny Salazar Muñoz es enfermera y además no monta servicio.

Plantilla actual: Danny José Escobar Marrero, Alirio Moame Padilla Zapata, Jessica Celia Fuentes Mora, Thamys Naibeth Ortiz Ortiz, Mairef Milagro Carico Mosqueda, Angelica Yesimar Núñez Cedeño. Vuelve a leer el título antes de asignar; no te quedes solo con esta lista.

## Cómo repartir

1. Reparte solo del 9 al 13. No reescribas el 7 ni el 8. No cuentes días anteriores al 7.
2. Cuenta los días con marca de cada aspirante en el tramo. El mismo día en dos roles cuenta como sobrecarga, no como equidad.
3. Respeta sexo y pelotón del rol. Estacionamiento es masculino.
4. Para cada hueco, elige a quien tenga menos días, el día libre y el rol permitido. Si hay empate, prioriza a quien lleve más días de distancia respecto de su guardia más cercana.
5. No des otra guardia a quien ya va por encima de sus compañeros. José Francisco Morao Mujica, pelotón 2 masculino, tiene cuatro días (7, 8, 10 y 12) mientras otros montan menos: ese reparto no se repite.
6. Antes de guardar, revisa que ningún excluido tenga marca, que ningún enfermero esté en comedor o estacionamiento y que nadie supere en más de un día a un compañero elegible del mismo sexo y pelotón con cupo libre.

`scripts/_equidad-med.ts` todavía deja la secuencia de medicina y enfermería como bloqueada y no veta comedor ni estacionamiento a los enfermeros. No lo ejecutes para equilibrar este tramo. Si lo modificas, alínealo con esta skill antes de `--apply`.
