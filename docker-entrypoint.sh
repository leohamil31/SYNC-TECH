#!/bin/sh
set -e

# Optional database bootstrap, controlled by environment variables.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running migrations..."
  ./node_modules/.bin/knex migrate:latest
fi

if [ "$RUN_SEEDS" = "true" ]; then
  echo "Running seeds..."
  ./node_modules/.bin/knex seed:run
fi

exec "$@"
