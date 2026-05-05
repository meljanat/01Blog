#!/usr/bin/env bash
set -euo pipefail

docker exec -it blog-db psql -U MOUAD -d blogdb
