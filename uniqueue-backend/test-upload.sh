#!/usr/bin/env bash
#
# End-to-end test for the UniQueue file upload + branding flow.
#
# Usage:
#   chmod +x test-upload.sh
#   ./test-upload.sh <super_admin_email> <super_admin_password>
#
# Example:
#   ./test-upload.sh admin@uniqueue.com SuperSecret123
#
set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
EMAIL="${1:-}"
PASSWORD="${2:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Usage: $0 <super_admin_email> <super_admin_password>"
  echo "   Or: BASE_URL=http://localhost:8080 $0 admin@... pass"
  exit 1
fi

# ─── Tiny helpers ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}▶${NC} $1"; }
need() { command -v "$1" >/dev/null || { echo "Missing dependency: $1"; exit 1; }; }

need curl
need jq

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  UniQueue File Upload E2E Test"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════
# 1. Health check
# ═══════════════════════════════════════════════════════
info "1. Checking backend is up..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/h2-console" || true)
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "302" ]]; then
  pass "Backend responding at $BASE_URL"
else
  fail "Backend not reachable at $BASE_URL (got $HTTP_CODE)"
fi

# ═══════════════════════════════════════════════════════
# 2. Login as super admin
# ═══════════════════════════════════════════════════════
info "2. Logging in as $EMAIL..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // empty')
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Login response:"
  echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
  fail "Could not extract token — check credentials"
fi
pass "Logged in (token: ${TOKEN:0:20}...)"

# ═══════════════════════════════════════════════════════
# 3. Create a test image (tiny PNG generated inline)
# ═══════════════════════════════════════════════════════
info "3. Creating test image..."
TMP_FILE=$(mktemp /tmp/uniqueue-test-XXXXXX.png)

# 1x1 transparent PNG (67 bytes) — base64 encoded
base64 -d > "$TMP_FILE" <<'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
EOF

FILE_SIZE=$(wc -c < "$TMP_FILE")
pass "Created test image ($FILE_SIZE bytes)"

# ═══════════════════════════════════════════════════════
# 4. Upload the image
# ═══════════════════════════════════════════════════════
info "4. Uploading via /api/files/upload..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMP_FILE;type=image/png")

if ! echo "$UPLOAD_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "Upload response:"
  echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null || echo "$UPLOAD_RESPONSE"
  fail "Upload failed"
fi

UPLOADED_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.url')
UPLOADED_FILENAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.filename')
pass "Uploaded: $UPLOADED_URL"

# ═══════════════════════════════════════════════════════
# 5. Serve the file back (public, no auth)
# ═══════════════════════════════════════════════════════
info "5. Fetching uploaded file (public GET)..."
SERVE_CODE=$(curl -s -o /tmp/uniqueue-fetched.png -w "%{http_code}" \
  "$BASE_URL$UPLOADED_URL")

if [[ "$SERVE_CODE" != "200" ]]; then
  fail "Serve returned $SERVE_CODE (expected 200)"
fi

FETCHED_SIZE=$(wc -c < /tmp/uniqueue-fetched.png)
if [[ "$FETCHED_SIZE" != "$FILE_SIZE" ]]; then
  fail "Size mismatch: uploaded $FILE_SIZE, fetched $FETCHED_SIZE"
fi
pass "File served correctly (public, no auth) — $FETCHED_SIZE bytes"

# ═══════════════════════════════════════════════════════
# 6. Register a university with the uploaded image as logo
# ═══════════════════════════════════════════════════════
TEST_CODE="TESTU$(date +%s | tail -c 5)"
TEST_DOMAIN="testu-$(date +%s).edu.ng"

info "6. Registering university ($TEST_CODE / $TEST_DOMAIN)..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/super-admin/universities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test University E2E\",
    \"code\": \"$TEST_CODE\",
    \"emailDomain\": \"$TEST_DOMAIN\",
    \"adminFullName\": \"E2E Test Admin\",
    \"adminEmail\": \"e2e-$TEST_CODE@$TEST_DOMAIN\",
    \"adminPassword\": \"Password123!\",
    \"tagline\": \"Testing end-to-end flow\",
    \"logoUrl\": \"$UPLOADED_URL\",
    \"campusImageUrl\": \"$UPLOADED_URL\"
  }")

if ! echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "Register response:"
  echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
  fail "University registration failed"
fi

REGISTERED_LOGO=$(echo "$REGISTER_RESPONSE" | jq -r '.data.logoUrl')
REGISTERED_CAMPUS=$(echo "$REGISTER_RESPONSE" | jq -r '.data.campusImageUrl')
REGISTERED_TAGLINE=$(echo "$REGISTER_RESPONSE" | jq -r '.data.tagline')

[[ "$REGISTERED_LOGO" == "$UPLOADED_URL" ]] || fail "logoUrl mismatch: got '$REGISTERED_LOGO'"
[[ "$REGISTERED_CAMPUS" == "$UPLOADED_URL" ]] || fail "campusImageUrl mismatch: got '$REGISTERED_CAMPUS'"
[[ "$REGISTERED_TAGLINE" == "Testing end-to-end flow" ]] || fail "tagline mismatch"
pass "University registered with branding intact"

# ═══════════════════════════════════════════════════════
# 7. Public lookup by domain (used by login page)
# ═══════════════════════════════════════════════════════
info "7. Public lookup by domain ($TEST_DOMAIN) — no auth..."
LOOKUP_RESPONSE=$(curl -s "$BASE_URL/api/auth/universities/lookup?domain=$TEST_DOMAIN")

if ! echo "$LOOKUP_RESPONSE" | jq -e '.success == true and .data != null' > /dev/null 2>&1; then
  echo "Lookup response:"
  echo "$LOOKUP_RESPONSE" | jq . 2>/dev/null || echo "$LOOKUP_RESPONSE"
  fail "Lookup failed"
fi

LOOKUP_NAME=$(echo "$LOOKUP_RESPONSE" | jq -r '.data.name')
LOOKUP_CAMPUS=$(echo "$LOOKUP_RESPONSE" | jq -r '.data.campusImageUrl')
[[ "$LOOKUP_NAME" == "Test University E2E" ]] || fail "Name mismatch: $LOOKUP_NAME"
[[ "$LOOKUP_CAMPUS" == "$UPLOADED_URL" ]] || fail "campusImageUrl not returned by lookup"
pass "Lookup returns campus photo + tagline (login page will show these)"

# ═══════════════════════════════════════════════════════
# 8. Cleanup local temp files
# ═══════════════════════════════════════════════════════
rm -f "$TMP_FILE" /tmp/uniqueue-fetched.png

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}  ALL TESTS PASSED ✓${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "What was verified:"
echo "  ✓ Backend reachable"
echo "  ✓ Super admin login"
echo "  ✓ File upload via POST /api/files/upload"
echo "  ✓ File serving via GET /api/files/{name} (public)"
echo "  ✓ University registration with branding"
echo "  ✓ Public domain lookup (login page flow)"
echo ""
echo "Test artifacts left in DB:"
echo "  • University: $TEST_CODE ($TEST_DOMAIN)"
echo "  • Uploaded file: $UPLOADED_FILENAME"
echo ""