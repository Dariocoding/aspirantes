#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ]; then
  echo "→ prisma migrate deploy"
  node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma
fi

exec "$@"
