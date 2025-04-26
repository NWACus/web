#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

function cleanup() {
  for job in $( jobs -p ); do
    kill -SIGTERM "${job}"
    wait "${job}"
  done
  rm -f login.json
}
trap cleanup EXIT

echo "[INFO] Starting the development server..."
rm -rf dev.db
sqlite3 dev.db -- 'PRAGMA journal_mode=WAL;'
set +o errexit
pnpm dev &
set -o errexit
for (( i = 0; i < 10; i++ )); do
  if ! curl -s http://localhost:3000; then
    echo "Dev server not yet started, waiting..."
    sleep 1
  else
    break
  fi
done

echo "[INFO] Creating the bootstrap user and seeding the database..."
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST http://localhost:3000/api/users/first-register --data '{"email":"bootstrap@avy.com","password":"test","confirm-password":"test","name":"Bootstrap User"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST http://localhost:3000/next/seed

echo "[INFO] Stopping the development server..."
set +o errexit
cleanup
set -o errexit

if [[ -n "${SKIP_BUILD:-}" ]]; then
  echo "[INFO] Skipping build..."
  exit 0
fi

echo "[INFO] Running a production build using the seeded database..."
pnpm build
