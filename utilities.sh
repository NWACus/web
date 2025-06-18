#!/usr/bin/env bash

function cleanup() {
  return_code="$?"
  echo "[INFO] Stopping the development server..."
  for job in $( jobs -p ); do
    kill -SIGTERM "${job}"
    if ! wait "${job}"; then
      echo "[WARN] Child job ${job} exited with $?."
    fi
  done
  rm -f login.json
  echo "[INFO] Cleaning up .next directory..."
  rm -rf .next
  if [[ "${return_code}" = "0" ]]; then
    echo "[INFO] Database at dev.db seeded!"
  else
    echo "[FAIL] Database at dev.db failed to seed!"
  fi
}


function setup_dev_server() {
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
}
