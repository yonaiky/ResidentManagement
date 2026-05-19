#!/bin/sh
set -e
cd /app

# Standalone image has no npm/npx; invoke Prisma CLI directly
if [ -f ./node_modules/prisma/build/index.js ]; then
  node ./node_modules/prisma/build/index.js migrate deploy
else
  echo "ERROR: Prisma CLI not found in node_modules/prisma"
  exit 1
fi

exec node server.js
