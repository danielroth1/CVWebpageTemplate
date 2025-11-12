#!/usr/bin/env bash
set -euo pipefail

# Incremental deployment script (SFTP) for the built assets.
# Only uploads files that are newer or have different size than the remote version.
# It does NOT delete remote files by default (can be enabled with CVWEBPAGETEMPLATE_DELETE=1).
#
# Required env vars:
#   CVWEBPAGETEMPLATE_ADDRESS          Remote host or IP
#   CVWEBPAGETEMPLATE_USERNAME         SFTP username
#   CVWEBPAGETEMPLATE_TARGET_FOLDER    Remote target folder (absolute or relative to user's home)
#
# Optional env vars:
#   CVWEBPAGETEMPLATE_PORT             SFTP port (default 22)
#   CVWEBPAGETEMPLATE_PASSWORD         SFTP password (otherwise SSH keys/agent are used)
#   CVWEBPAGETEMPLATE_LOCAL_FOLDER     Local folder to deploy (default ./dist, falls back to ./build if dist missing)
#   CVWEBPAGETEMPLATE_DELETE           If set to 1, delete remote files not present locally
#   CVWEBPAGETEMPLATE_DRY_RUN          If set to 1, show what would change without uploading
#   CVWEBPAGETEMPLATE_SKIP_MEDIA       If set to 1, skip video and large image files (mp4, webm, mov, avi, mkv, flv, wmv)
#   CVWEBPAGETEMPLATE_PASSWORT         (German spelling) alternative for PASSWORD
#
# Exit codes:
#   2 - Local folder missing
#   3 - lftp not installed
#   5 - Cannot access remote target folder
#   6 - No write permission in remote target folder
#   7 - Mirror operation failed

usage() {
  cat <<EOF
Incremental deploy usage:
  CVWEBPAGETEMPLATE_ADDRESS=host \\
  CVWEBPAGETEMPLATE_USERNAME=user \\
  CVWEBPAGETEMPLATE_TARGET_FOLDER=/path/on/server \\
  [CVWEBPAGETEMPLATE_PORT=22] \\
  [CVWEBPAGETEMPLATE_PASSWORD=secret] \\
  [CVWEBPAGETEMPLATE_LOCAL_FOLDER=./dist] \\
  ./scripts/deploy.sh [OPTIONS]

Options:
  --skip-media       Skip video files (mp4, webm, mov, etc.) during deployment
  --delete           Delete remote files not present locally
  --dry-run          Show what would change without uploading
  --debug            Enable verbose debugging output
  -h, --help         Show this help message

Environment variables (alternative to flags):
  CVWEBPAGETEMPLATE_SKIP_MEDIA=1
  CVWEBPAGETEMPLATE_DELETE=1
  CVWEBPAGETEMPLATE_DRY_RUN=1
  CVWEBPAGETEMPLATE_DEBUG=1

Behavior:
  - Uses lftp mirror -R with timestamps & size comparison.
  - Uploads only newer/different files (skips unchanged).
  - Preserves remote extra files unless --delete is used.
  - Dry run prints planned changes without transferring.
  - Skip media excludes video files to save bandwidth/time.
EOF
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage; exit 0
      ;;
    --skip-media)
      CVWEBPAGETEMPLATE_SKIP_MEDIA=1
      shift
      ;;
    --delete)
      CVWEBPAGETEMPLATE_DELETE=1
      shift
      ;;
    --dry-run)
      CVWEBPAGETEMPLATE_DRY_RUN=1
      shift
      ;;
    --debug)
      CVWEBPAGETEMPLATE_DEBUG=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Run with --help for usage information." >&2
      exit 1
      ;;
  esac
done

: "${CVWEBPAGETEMPLATE_ADDRESS?Need CVWEBPAGETEMPLATE_ADDRESS env var}"
: "${CVWEBPAGETEMPLATE_USERNAME?Need CVWEBPAGETEMPLATE_USERNAME env var}"
: "${CVWEBPAGETEMPLATE_TARGET_FOLDER?Need CVWEBPAGETEMPLATE_TARGET_FOLDER env var}"

CV_HOST="${CVWEBPAGETEMPLATE_ADDRESS}"
CV_PORT="${CVWEBPAGETEMPLATE_PORT:-22}"
CV_USER="${CVWEBPAGETEMPLATE_USERNAME}"
CV_PASS="${CVWEBPAGETEMPLATE_PASSWORD:-}"; [[ -z "$CV_PASS" && -n "${CVWEBPAGETEMPLATE_PASSWORT:-}" ]] && CV_PASS="${CVWEBPAGETEMPLATE_PASSWORT}"
CV_TARGET="${CVWEBPAGETEMPLATE_TARGET_FOLDER}"

# Determine local folder (prefer explicit, then dist, then build)
LOCAL_ROOT="${CVWEBPAGETEMPLATE_LOCAL_FOLDER:-}"
if [ -z "$LOCAL_ROOT" ]; then
  if [ -d ./dist ]; then
    LOCAL_ROOT=./dist
  elif [ -d ./build ]; then
    LOCAL_ROOT=./build
  else
    LOCAL_ROOT=./dist # default (will fail below if missing)
  fi
fi

if [ ! -d "${LOCAL_ROOT}" ]; then
  echo "Error: local folder '${LOCAL_ROOT}' not found. Build first (e.g. 'npm run build')." >&2
  exit 2
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "Error: 'lftp' not installed. Install with 'brew install lftp'." >&2
  exit 3
fi

DELETE_FLAG="${CVWEBPAGETEMPLATE_DELETE:-0}"
DRY_RUN="${CVWEBPAGETEMPLATE_DRY_RUN:-0}"
SKIP_MEDIA="${CVWEBPAGETEMPLATE_SKIP_MEDIA:-0}"
DEBUG="${CVWEBPAGETEMPLATE_DEBUG:-0}"

echo "Incremental deploying ${LOCAL_ROOT} -> sftp://${CV_USER}@${CV_HOST}:${CV_PORT}/${CV_TARGET}";
echo "Options: delete=${DELETE_FLAG} dry-run=${DRY_RUN} skip-media=${SKIP_MEDIA} debug=${DEBUG}";

# Build connection args
if [ -n "$CV_PASS" ]; then
  LFTP_AUTH=( -u "${CV_USER},${CV_PASS}" )
else
  LFTP_AUTH=( -u "${CV_USER}" )
fi

REMOTE_PATH="${CV_TARGET%/}/"

# Base mirror options:
#  --only-newer : upload only if local newer (still uploads if remote missing)
#  --parallel=4 : parallel transfers for speed
#  --no-perms   : don't try to sync permissions (faster)
#  --verbose    : show decisions
#  --scan-all-first : build file list first (stable output ordering)
MIRROR_OPTS=( -R --only-newer --parallel=4 --no-perms --verbose --scan-all-first )

if [ "$DELETE_FLAG" = "1" ]; then
  MIRROR_OPTS+=( --delete )
fi

if [ "$DRY_RUN" = "1" ]; then
  MIRROR_OPTS+=( --dry-run )
fi

# Exclude media files if requested (saves bandwidth and time for large video files)
if [ "$SKIP_MEDIA" = "1" ]; then
  echo "Skipping media files (videos and large images)..."
  # Exclude common video formats
  MIRROR_OPTS+=( --exclude-glob '*.mp4' )
  MIRROR_OPTS+=( --exclude-glob '*.webm' )
  MIRROR_OPTS+=( --exclude-glob '*.mov' )
  MIRROR_OPTS+=( --exclude-glob '*.avi' )
  MIRROR_OPTS+=( --exclude-glob '*.mkv' )
  MIRROR_OPTS+=( --exclude-glob '*.flv' )
  MIRROR_OPTS+=( --exclude-glob '*.wmv' )
  MIRROR_OPTS+=( --exclude-glob '*.m4v' )
  MIRROR_OPTS+=( --exclude-glob '*.mpg' )
  MIRROR_OPTS+=( --exclude-glob '*.mpeg' )
  MIRROR_OPTS+=( --exclude-glob '*.jpg' )
  MIRROR_OPTS+=( --exclude-glob '*.jpeg' )
  MIRROR_OPTS+=( --exclude-glob '*.png' )
fi

# lftp command sequence:
# 1. auto-confirm sftp prompts
# 2. ensure remote path exists
# 3. mirror with incremental options
# 4. quit
PREFIX_CMDS="set sftp:auto-confirm yes;"
if [ "$DEBUG" = "1" ]; then
  PREFIX_CMDS="$PREFIX_CMDS set cmd:trace yes; set cmd:verbose yes; set net:timeout 20; set net:max-retries 2;"
fi

# We attempt to create the remote path, but tolerate failure (e.g. due to permissions) and continue
# so long as we can cd into it afterwards.
# Build mirror options as a string for lftp
MIRROR_OPTS_STR="${MIRROR_OPTS[*]}"

# Use a timestamp-based temp dir name since $$ doesn't work in lftp
WRITE_TEST_DIR=".cvwp_test_$(date +%s)"

LFTP_SCRIPT=$(cat <<EOF
$PREFIX_CMDS
mkdir -p $REMOTE_PATH || echo '(info) mkdir failed or already exists'
cd $REMOTE_PATH
pwd
cls -1
mkdir $WRITE_TEST_DIR && rmdir $WRITE_TEST_DIR || echo 'Warning: write test failed but continuing'
mirror $MIRROR_OPTS_STR ${LOCAL_ROOT%/}/ ./
quit
EOF
)

echo "Running lftp incremental sync..."

# Run lftp but capture exit status for clearer error reporting
set +e
lftp "${LFTP_AUTH[@]}" -p "$CV_PORT" "sftp://$CV_HOST" -e "$LFTP_SCRIPT"
LFTP_EXIT=$?
set -e

if [ $LFTP_EXIT -ne 0 ]; then
  echo "Error: lftp exited with status $LFTP_EXIT" >&2
  echo "Hint: Common causes include incorrect CVWEBPAGETEMPLATE_TARGET_FOLDER (provider might require e.g. 'htdocs/' or full absolute path) or lacking write permissions." >&2
  echo "      Re-run with CVWEBPAGETEMPLATE_DEBUG=1 CVWEBPAGETEMPLATE_DRY_RUN=1 for verbose diagnostics." >&2
  exit $LFTP_EXIT
fi

echo "Deploy finished (incremental)."
