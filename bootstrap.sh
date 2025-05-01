#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

function cleanup() {
  rm -f login.json
  for job in $( jobs -p ); do
    kill -SIGKILL "${job}"
    wait "${job}"
  done
  echo "[INFO] dev.db bootstrapped run 'pnpm dev' and log in with user bootstrap@avy.com, password localpass"
}
trap cleanup EXIT

echo "[INFO] Starting the development server..."
rm -rf dev.db dev.db-shm dev.db-wal
sqlite3 dev.db -- 'PRAGMA journal_mode=WAL;'
set +o errexit
pnpm dev &
set -o errexit
for (( i = 0; i < 10; i++ )); do
  if ! curl -s http://localhost:3000 >/dev/null; then
    echo "Dev server not yet started, waiting..."
    sleep 1
  else
    break
  fi
done

echo "[INFO] Creating the bootstrap user and seeding the database..."
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST http://localhost:3000/api/users/first-register --data '{"email":"bootstrap@avy.com","password":"localpass","confirm-password":"localpass","name":"Bootstrap User"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST http://localhost:3000/next/bootstrap
