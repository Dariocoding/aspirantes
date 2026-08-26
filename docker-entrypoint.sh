#!/bin/sh
set -e

echo "starting fanb-aspirantes"
echo "  NODE_ENV=${NODE_ENV:-} PORT=${PORT:-} HOSTNAME=${HOSTNAME:-}"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "prisma migrate deploy"
  if ! node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma; then
    echo "prisma migrate deploy failed (is DATABASE_URL reachable from the container?)"
    exit 1
  fi
else
  echo "DATABASE_URL empty - skipping migrate"
fi

if [ ! -f server.js ]; then
  echo "missing /app/server.js (standalone copy failed)"
  ls -la
  exit 1
fi

echo "exec $*"
exec "$@"
