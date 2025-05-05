#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

function cleanup() {
  rm -f login.json
}
trap cleanup EXIT

echo "[INFO] Logging in with the bootstrap user and incrementally re-seeding the database..."
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST http://localhost:3000/api/users/login --data '{"email":"admin@avy.com","password":"localpass"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST http://localhost:3000/next/incremental
