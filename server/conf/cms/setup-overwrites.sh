#!/usr/bin/env bash
# Seed Core-CMS client settings for local Core-Portal dev.
# Host paths match container: taccsite_cms/settings/overwrites/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVERWRITES_DIR="${SCRIPT_DIR}/settings/overwrites"
VERSION="${CORE_CMS_SETTINGS_REF:-fix/1084-settings-overwrites}"
BASE_URL="https://raw.githubusercontent.com/TACC/Core-CMS/${VERSION}/taccsite_cms/settings/overwrites"

mkdir -p "${OVERWRITES_DIR}"

download_file() {
  local url="$1"
  local output_file="$2"
  local description="$3"
  echo "Downloading ${description}..."
  curl -fsSL "${url}" -o "${output_file}"
}

for file in settings_custom settings_local secrets; do
  settings_file="${OVERWRITES_DIR}/${file}.py"
  example_file="${OVERWRITES_DIR}/${file}.example.py"
  url="${BASE_URL}/${file}.example.py"

  if [ -f "${settings_file}" ]; then
    echo "${settings_file} already exists; skipping."
    continue
  fi

  if [ -f "${example_file}" ]; then
    cp "${example_file}" "${settings_file}"
    echo "Copied ${example_file} → ${settings_file}"
    continue
  fi

  download_file "${url}" "${settings_file}" "${file}.py"
done

if [ ! -f "${OVERWRITES_DIR}/settings_default.py" ]; then
  echo "Error: missing ${OVERWRITES_DIR}/settings_default.py (should be committed in Core-Portal)."
  exit 1
fi

echo "CMS overwrites ready in ${OVERWRITES_DIR}"
