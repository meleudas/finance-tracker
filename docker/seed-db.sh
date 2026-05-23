#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
docker compose --profile seed run --rm seed
