#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

if [[ -n "${CI:-}" ]]; then
  set -o xtrace
fi

source "$( dirname "$( realpath "${BASH_SOURCE[0]}" )" )/utilities.sh"
trap cleanup EXIT

setup_dev_server

echo "[INFO] Generating static tenants..."
pnpm generate:static-tenants

echo "[INFO] Creating the bootstrap user and seeding the database..."
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST --fail-with-body http://localhost:3000/api/users/first-register --data '{"email":"bootstrap@avy.com","password":"test","confirm-password":"test","name":"Bootstrap User"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST --fail-with-body http://localhost:3000/next/seed
