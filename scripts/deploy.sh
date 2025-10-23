#!/usr/bin/env bash
set -euo pipefail

# Deploy built dist/ folder to remote webserver using environment variables (SFTP-only)
# Required env vars:
#   CVWEBPAGETEMPLATE_ADDRESS - remote host or IP
#   CVWEBPAGETEMPLATE_PORT - SFTP port (optional, default 22)
#   CVWEBPAGETEMPLATE_USERNAME - SFTP username
#   CVWEBPAGETEMPLATE_PASSWORD - SFTP password (optional, insecure)
#   CVWEBPAGETEMPLATE_TARGET_FOLDER - remote target folder (absolute or relative to user's home)

usage() {
  cat <<EOF
Usage: CVWEBPAGETEMPLATE_ADDRESS=host \
       CVWEBPAGETEMPLATE_USERNAME=user \
       CVWEBPAGETEMPLATE_TARGET_FOLDER=/path/on/server \
       [CVWEBPAGETEMPLATE_PORT=22] \
       [CVWEBPAGETEMPLATE_PASSWORD=secret] \
       ./scripts/deploy.sh

This script synchronizes the local dist/ directory to the remote target folder using SFTP.
It requires `lftp` to be installed locally. It will remove remote files not present locally.
If CVWEBPAGETEMPLATE_PASSWORD is set, the script will use it for authentication; otherwise it will
use your SSH key agent or key files configured for SFTP.
EOF
}

# Ensure required env vars are present
: "${CVWEBPAGETEMPLATE_ADDRESS?Need CVWEBPAGETEMPLATE_ADDRESS env var}"
: "${CVWEBPAGETEMPLATE_USERNAME?Need CVWEBPAGETEMPLATE_USERNAME env var}"
: "${CVWEBPAGETEMPLATE_TARGET_FOLDER?Need CVWEBPAGETEMPLATE_TARGET_FOLDER env var}"

CV_HOST="${CVWEBPAGETEMPLATE_ADDRESS}"
CV_PORT="${CVWEBPAGETEMPLATE_PORT:-22}"
CV_USER="${CVWEBPAGETEMPLATE_USERNAME}"
CV_PASS="${CVWEBPAGETEMPLATE_PASSWORD:-}"
CV_TARGET="${CVWEBPAGETEMPLATE_TARGET_FOLDER}"

# Local build folder
LOCAL_DIST="./dist"

if [ ! -d "${LOCAL_DIST}" ]; then
  echo "Error: local dist/ folder not found. Run 'npm run build' first." >&2
  exit 2
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "Error: 'lftp' is required for SFTP deployments but not found. Install it (e.g. 'brew install lftp')." >&2
  exit 3
fi

echo "Deploying ${LOCAL_DIST} -> sftp://${CV_USER}@${CV_HOST}:${CV_PORT}${CV_TARGET}"

# Build lftp connection string. Use password if provided; otherwise rely on SSH keys/agent
if [ -n "${CV_PASS}" ]; then
  # Escape single quotes in password for lftp -u 'user,password'
  ESC_PASS="${CV_PASS//"/\""}"
  LFTP_USERPASS="-u ${CV_USER},${ESC_PASS}"
else
  LFTP_USERPASS="-u ${CV_USER}"
fi

# Ensure target path formatting
REMOTE_PATH="${CV_TARGET%/}/"

# Use lftp mirror to upload and delete remote files not present locally
#!/usr/bin/env bash
set -euo pipefail

# Deploy built dist/ folder to remote webserver using environment variables (SFTP-only)
# Required env vars:
#   CVWEBPAGETEMPLATE_ADDRESS - remote host or IP
#   CVWEBPAGETEMPLATE_PORT - SFTP port (optional, default 22)
#   CVWEBPAGETEMPLATE_USERNAME - SFTP username
#   CVWEBPAGETEMPLATE_PASSWORD - SFTP password (optional, insecure)
#   CVWEBPAGETEMPLATE_TARGET_FOLDER - remote target folder (absolute or relative to users home)

usage() {
  cat <<EOF
Usage: CVWEBPAGETEMPLATE_ADDRESS=host \
       CVWEBPAGETEMPLATE_USERNAME=user \
       CVWEBPAGETEMPLATE_TARGET_FOLDER=/path/on/server \
       [CVWEBPAGETEMPLATE_PORT=22] \
       [CVWEBPAGETEMPLATE_PASSWORD=secret] \
       ./scripts/deploy.sh

This script synchronizes the local dist/ directory to the remote target folder using SFTP.
It requires lftp to be installed locally. It will remove remote files not present locally.
If CVWEBPAGETEMPLATE_PASSWORD is set, the script will use it for authentication; otherwise it will
use your SSH key agent or key files configured for SFTP.
EOF
}

# Ensure required env vars are present
: "${CVWEBPAGETEMPLATE_ADDRESS?Need CVWEBPAGETEMPLATE_ADDRESS env var}"
: "${CVWEBPAGETEMPLATE_USERNAME?Need CVWEBPAGETEMPLATE_USERNAME env var}"
: "${CVWEBPAGETEMPLATE_TARGET_FOLDER?Need CVWEBPAGETEMPLATE_TARGET_FOLDER env var}"

CV_HOST="${CVWEBPAGETEMPLATE_ADDRESS}"
CV_PORT="${CVWEBPAGETEMPLATE_PORT:-22}"
CV_USER="${CVWEBPAGETEMPLATE_USERNAME}"

# Support both PASSWORD and PASSWORT (common typo)
CV_PASS="${CVWEBPAGETEMPLATE_PASSWORD:-}"
if [ -z "${CV_PASS}" ] && [ -n "${CVWEBPAGETEMPLATE_PASSWORT:-}" ]; then
  CV_PASS="${CVWEBPAGETEMPLATE_PASSWORT}"
fi

CV_TARGET="${CVWEBPAGETEMPLATE_TARGET_FOLDER}"

# Local build folder
LOCAL_DIST="./dist"

if [ ! -d "${LOCAL_DIST}" ]; then
  echo "Error: local dist/ folder not found. Run 'npm run build' first." >&2
  exit 2
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "Error: 'lftp' is required for SFTP deployments but not found. Install it (e.g. 'brew install lftp')." >&2
  exit 3
fi

echo "Deploying ${LOCAL_DIST} -> sftp://${CV_USER}@${CV_HOST}:${CV_PORT}${CV_TARGET}"

# Build lftp connection args. Use password if provided; otherwise rely on SSH keys/agent
if [ -n "${CV_PASS}" ]; then
  LFTP_USERPASS_ARGS=( -u "${CV_USER},${CV_PASS}" )
else
  LFTP_USERPASS_ARGS=( -u "${CV_USER}" )
fi

# Ensure target path formatting
REMOTE_PATH="${CV_TARGET%/}/"

# Build lftp command string with variable expansion done by bash
LFTP_CMD="set sftp:auto-confirm yes; mkdir -p \"${REMOTE_PATH}\"; mirror -R --delete --verbose --parallel=2 \"${LOCAL_DIST%/}/\" \"${REMOTE_PATH}\"; quit"

echo "Running lftp..."

# Run lftp with the generated script via args array (handles special chars safely)
lftp "${LFTP_USERPASS_ARGS[@]}" -p "${CV_PORT}" "sftp://${CV_HOST}" -e "${LFTP_CMD}"

echo "Deploy complete."
