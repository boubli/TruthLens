#!/bin/bash

# Vercel Ignore Build Step Script
# Exits with 0 to ignore the build (cancel).
# Exits with 1 to proceed with the build.

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  echo "✅ - Branch is 'main'. Proceeding with build."
  exit 1
else
  echo "🛑 - Branch is '$VERCEL_GIT_COMMIT_REF'. Ignoring build."
  exit 0
fi
