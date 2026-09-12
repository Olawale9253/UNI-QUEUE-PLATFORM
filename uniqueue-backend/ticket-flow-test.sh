#!/bin/bash
# UniQueue — Full Ticket Flow Test
# Run: bash ticket-flow-test.sh

set -e
BASE="http://localhost:8080"

# Colors
G="\033[0;32m"; R="\033[0;31m"; Y="\033[0;33m"; N="\033[0m"
ok() { echo -e "${G}✅ $1${N}"; }
fail() { echo -e "${R}❌ $1${N}"; exit 1; }
step() { echo -e "\n${Y}━━━ $1 ━━━${N}"; }

# ---------- SETUP ----------
step "1. Login as ADMIN"
ADMIN_TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unilag.edu.ng","password":"admin1234"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))")
[ -z "$ADMIN_TOKEN" ] && fail "Admin login failed"
ok "Admin token acquired"

step "2. Login as STUDENT"
STUDENT_TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@unilag.edu.ng","password":"password123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))")
[ -z "$STUDENT_TOKEN" ] && fail "Student login failed (did you register the student?)"
ok "Student token acquired"

# ---------- ADMIN: CREATE QUEUE ----------
step "3. Admin creates a queue"
QUEUE_RESP=$(curl -s -X POST $BASE/api/admin/queues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Bursary",
    "description": "Fee payment",
    "location": "Block A",
    "maxCapacity": 50,
    "averageServiceMinutes": 5
  }')
echo "$QUEUE_RESP" | python3 -m json.tool
QUEUE_ID=$(echo "$QUEUE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
ok "Queue created: id=$QUEUE_ID"

# ---------- STUDENT: JOIN QUEUE ----------
step "4. Student joins the queue"
JOIN_RESP=$(curl -s -X POST $BASE/api/user/tickets/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d "{\"queueId\": $QUEUE_ID}")
echo "$JOIN_RESP" | python3 -m json.tool
TICKET_ID=$(echo "$JOIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
TICKET_NUM=$(echo "$JOIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['ticketNumber'])")
ok "Joined — ticket $TICKET_NUM (id=$TICKET_ID)"

step "5. Student checks active ticket"
curl -s $BASE/api/user/tickets/active \
  -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

# ---------- ADMIN: CREATE + ASSIGN STAFF ----------
step "6. Admin creates a staff member"
STAFF_RESP=$(curl -s -X POST $BASE/api/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "fullName": "Jane Cashier",
    "email": "jane.staff@unilag.edu.ng",
    "password": "staff1234",
    "department": "Bursary"
  }')
echo "$STAFF_RESP" | python3 -m json.tool

# If already exists, fetch existing staff id
STAFF_ID=$(echo "$STAFF_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id','') if d.get('success') else '')")

if [ -z "$STAFF_ID" ]; then
  echo "Staff likely already exists — fetching from staff list..."
  STAFF_ID=$(curl -s $BASE/api/admin/staff \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys,json; staff=[s for s in json.load(sys.stdin)['data'] if s['email']=='jane.staff@unilag.edu.ng']; print(staff[0]['id'] if staff else '')")
fi

[ -z "$STAFF_ID" ] && fail "Could not resolve staff id"
ok "Staff id=$STAFF_ID"

step "7. Admin assigns staff to queue"
curl -s -X POST $BASE/api/admin/queues/$QUEUE_ID/staff/$STAFF_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
ok "Staff assigned"

# ---------- STAFF: SERVE FLOW ----------
step "8. Staff logs in"
STAFF_TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane.staff@unilag.edu.ng","password":"staff1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
ok "Staff token acquired"

step "9. Staff lists assigned queues"
curl -s $BASE/api/staff/queues \
  -H "Authorization: Bearer $STAFF_TOKEN" | python3 -m json.tool

step "10. Staff lists tickets in queue $QUEUE_ID"
curl -s $BASE/api/staff/queues/$QUEUE_ID/tickets \
  -H "Authorization: Bearer $STAFF_TOKEN" | python3 -m json.tool

step "11. Staff calls the next ticket"
CALL_RESP=$(curl -s -X POST $BASE/api/staff/queues/$QUEUE_ID/next \
  -H "Authorization: Bearer $STAFF_TOKEN")
echo "$CALL_RESP" | python3 -m json.tool
STATUS=$(echo "$CALL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$STATUS" = "CALLED" ] && ok "Status = CALLED" || fail "Expected CALLED, got $STATUS"

step "12. Staff serves the ticket"
SERVE_RESP=$(curl -s -X POST $BASE/api/staff/tickets/$TICKET_ID/serve \
  -H "Authorization: Bearer $STAFF_TOKEN")
echo "$SERVE_RESP" | python3 -m json.tool
STATUS=$(echo "$SERVE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$STATUS" = "SERVING" ] && ok "Status = SERVING" || fail "Expected SERVING, got $STATUS"

step "13. Staff completes the ticket"
DONE_RESP=$(curl -s -X POST $BASE/api/staff/tickets/$TICKET_ID/complete \
  -H "Authorization: Bearer $STAFF_TOKEN")
echo "$DONE_RESP" | python3 -m json.tool
STATUS=$(echo "$DONE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$STATUS" = "COMPLETED" ] && ok "Status = COMPLETED" || fail "Expected COMPLETED, got $STATUS"

# ---------- STUDENT: POST-SERVICE ----------
step "14. Student has no active ticket"
curl -s $BASE/api/user/tickets/active \
  -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

step "15. Student history"
curl -s $BASE/api/user/tickets/history \
  -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

# ---------- SECURITY BOUNDARIES ----------
step "16. Student cannot access staff routes"
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/staff/queues \
  -H "Authorization: Bearer $STUDENT_TOKEN")
[ "$CODE" = "403" ] && ok "Student → /api/staff = 403" || fail "Expected 403, got $CODE"

step "17. Staff cannot access admin routes"
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/admin/queues \
  -H "Authorization: Bearer $STAFF_TOKEN")
[ "$CODE" = "403" ] && ok "Staff → /api/admin = 403" || fail "Expected 403, got $CODE"

step "18. Unauthenticated cannot access /me"
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/me)
[ "$CODE" = "401" ] && ok "No token → /api/auth/me = 401" || fail "Expected 401, got $CODE"

echo -e "\n${G}━━━ ALL TESTS PASSED 🎉 ━━━${N}\n"