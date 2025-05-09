#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

function cleanup() {
  rm -f login.json
}
trap cleanup EXIT

echo "[INFO] Logging in with the bootstrap user and incrementally re-seeding the database..."
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "[ERROR] Couldn't contact the server at localhost:3000 - make sure you have 'pnpm dev' running in another terminal."
fi
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST --fail-with-body http://localhost:3000/api/users/login --data '{"email":"admin@avy.com","password":"localpass"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST --fail-with-body http://localhost:3000/next/incremental
