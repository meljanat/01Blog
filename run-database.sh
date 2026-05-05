#!/usr/bin/env bash
set -euo pipefail

container_name="blog-db"
volume_name="01blog_db_data"

if docker ps --format '{{.Names}}' | grep -qx "$container_name"; then
  echo "PostgreSQL is already running in container $container_name."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$container_name"; then
  docker start "$container_name" >/dev/null
else
  docker run -d \
    --name "$container_name" \
    -e POSTGRES_USER=MOUAD \
    -e POSTGRES_PASSWORD=mmm \
    -e POSTGRES_DB=blogdb \
    -p 5432:5432 \
    -v "$volume_name":/var/lib/postgresql/data \
    postgres:15 >/dev/null
fi

echo "Waiting for PostgreSQL to accept connections..."
until docker exec "$container_name" pg_isready -U MOUAD -d blogdb >/dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL is ready at localhost:5432/blogdb."
