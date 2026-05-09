#!/usr/bin/env bash
# Local environment variables for backend database and JWT configuration.
# Load this file before running the backend, e.g.:
#   source ./setup-env.sh

export DATABASE_URL="jdbc:postgresql://localhost:5432/blogdb"
export DATABASE_USERNAME="MOUAD"
export DATABASE_PASSWORD="mmm"
export JWT_SECRET="$(openssl rand -hex 32)"
export JWT_EXPIRATION_MS="86400000"
export UPLOAD_PATH="./uploads"
