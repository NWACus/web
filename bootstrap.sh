#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

source "$( dirname "$( realpath "${BASH_SOURCE[0]}" )" )/utilities.sh"
trap cleanup EXIT

setup_dev_server

echo "[INFO] Creating the bootstrap user and running a minimal seed on the database..."
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' -X POST http://localhost:3000/api/users/first-register --data '{"email":"bootstrap@avy.com","password":"localpass","confirm-password":"localpass","name":"Bootstrap User"}' > login.json
curl -H "Authorization: Bearer $( jq --raw-output .token <login.json )" -X POST http://localhost:3000/next/bootstrap
