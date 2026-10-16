# Bot Telegram de roles de servicio (Coolify / VPS)

Envía al grupo:

- **07:00** (America/Caracas): servicios **diurnos + nocturnos** del día.
- **18:00** (America/Caracas): **recordatorio nocturno** (solo nocturnos).

No usa Vercel Cron. Coolify llama a las API internas con un secreto.

## 1. Crear el bot y el grupo

1. En Telegram, habla con [@BotFather](https://t.me/BotFather) → `/newbot` → copia el token.
2. Crea un grupo, agrega el bot y dale permiso para enviar mensajes (admin recomendado).
3. Escribe cualquier mensaje en el grupo.
4. Abre en el navegador (sustituye el token):

   `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`

5. Busca `"chat":{"id":-100...}` → ese valor es `TELEGRAM_CHAT_ID`.

## 2. Variables en Coolify

En la aplicación (Environment Variables):

| Variable | Descripción |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather |
| `TELEGRAM_CHAT_ID` | ID del grupo (negativo) |
| `CRON_SECRET` | Secreto largo aleatorio (mismo que usarás en el cron) |
| `TZ` | `America/Caracas` |

También en local (`.env.local`) si vas a probar con el script.

Generar un secreto:

```bash
openssl rand -base64 32
```

## 3. Endpoints

Protegidos con:

- `Authorization: Bearer <CRON_SECRET>`, o
- header `x-cron-secret: <CRON_SECRET>`

| Ruta | Uso |
|---|---|
| `POST /api/cron/telegram/servicios-manana` | 7:00 — diurnos + nocturnos |
| `POST /api/cron/telegram/recordatorio-nocturno` | 18:00 — solo nocturnos |

Query opcional: `?dryRun=1` arma el mensaje y **no** lo envía (útil para probar auth/carga).

## 4. Scheduled Tasks en Coolify

Venezuela es **UTC−4** todo el año. Si el cron de Coolify corre en UTC:

| Cron (UTC) | Hora Caracas | Comando |
|---|---|---|
| `0 11 * * *` | 07:00 | `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://TU_DOMINIO/api/cron/telegram/servicios-manana` |
| `0 22 * * *` | 18:00 | `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://TU_DOMINIO/api/cron/telegram/recordatorio-nocturno` |

Si Coolify usa la TZ del contenedor y ya pusiste `TZ=America/Caracas`, puedes usar `0 7 * * *` y `0 18 * * *`.

Sustituye `TU_DOMINIO` por la URL pública de la app. Asegúrate de que `$CRON_SECRET` esté disponible en el entorno de la tarea (misma app o valor pegado).

## 5. Prueba local

```bash
# Vista previa (no envía)
npx tsx scripts/telegram-dry-run.ts

# Solo nocturno
npx tsx scripts/telegram-dry-run.ts --modo=recordatorio-nocturno

# Enviar de verdad (requiere token + chat_id en .env.local)
npx tsx scripts/telegram-dry-run.ts --send
```

O contra el servidor:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://TU_DOMINIO/api/cron/telegram/servicios-manana?dryRun=1"
```

## Notas

- La fecha del mensaje es la civil en `America/Caracas`.
- Diurnos = roles del día; nocturnos = guardia de **esa misma noche** (estacionamiento / turnos).
- Si no hay plan del mes (o del mes siguiente al cruzar de mes), el endpoint responde error 500 con el motivo.
