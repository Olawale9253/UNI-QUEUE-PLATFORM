#!/bin/bash
# UniQueue — Waitlist Flow Test
set -e
BASE="http://localhost:8080"
GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[0;33m"; RESET="\033[0m"
ok()   { echo -e "${GREEN}✅ $1${RESET}"; }
fail() { echo -e "${RED}❌ $1${RESET}"; exit 1; }
step() { echo -e "\n${YELLOW}━━━ $1 ━━━${RESET}"; }

# ---------- TOKENS ----------
step "1. Login all roles"
ADMIN_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@unilag.edu.ng","password":"admin1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

STUDENT_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@unilag.edu.ng","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

STAFF_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"jane.staff@unilag.edu.ng","password":"staff1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

ok "Tokens acquired"

# ---------- REGISTER SECOND STUDENT ----------
step "2. Ensure second student exists"
RESP=$(curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{
    "fullName": "Second Student",
    "email": "student2@unilag.edu.ng",
    "password": "password123",
    "universityId": 1,
    "matricNumber": "21/99999/002",
    "department": "Computer Science"
  }')
echo "$RESP" | python3 -c "
import sys,json
response_data=json.load(sys.stdin)
print('  Registered' if response_data.get('success') else f\"  Already exists: {response_data.get('message')}\")
"

STUDENT2_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student2@unilag.edu.ng","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
ok "Student2 logged in"

# ---------- CLEAR EXISTING TICKETS ----------
step "3. Clear any existing active tickets"
for TK in "$STUDENT_TOKEN" "$STUDENT2_TOKEN"; do
  TID=$(curl -s $BASE/api/user/tickets/active -H "Authorization: Bearer $TK" \
    | python3 -c "import sys,json; response_data=json.load(sys.stdin)['data']; print(response_data['id'] if response_data else '')")
  [ -n "$TID" ] && curl -s -X DELETE $BASE/api/user/tickets/$TID -H "Authorization: Bearer $TK" > /dev/null
done
ok "Cleared"

# ---------- ENABLE WAITLIST ----------
step "4. Enable waitlist on Bursary (cap=1, waitlist=5)"
curl -s -X PUT $BASE/api/admin/queues/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"maxCapacity": 1, "allowWaitlist": true, "autoPromoteWaitlist": true, "maxWaitlistSize": 5}' \
  | python3 -c "import sys,json; response_data=json.load(sys.stdin)['data']; print(f\"  capacity={response_data['maxCapacity']} allowWaitlist={response_data['allowWaitlist']} autoPromote={response_data['autoPromoteWaitlist']}\")"
ok "Waitlist enabled"

# ---------- S1 JOINS ----------
step "5. Student 1 joins (should be WAITING)"
S1_RESP=$(curl -s -X POST $BASE/api/user/tickets/join -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -d '{"queueId": 1}')
echo "$S1_RESP" | python3 -c "
import sys,json
response_data=json.load(sys.stdin)['data']
print(f\"  S1 → {response_data['ticketNumber']} status={response_data['status']} pos={response_data['position']} onWaitlist={response_data['onWaitlist']}\")
"
S1_TID=$(echo "$S1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
ok "S1 joined (ticket id=$S1_TID)"

# ---------- S2 JOINS → WAITLISTED ----------
step "6. Student 2 joins (should be WAITLISTED)"
S2_RESP=$(curl -s -X POST $BASE/api/user/tickets/join -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT2_TOKEN" -d '{"queueId": 1}')
echo "$S2_RESP" | python3 -c "
import sys,json
response_data=json.load(sys.stdin)['data']
print(f\"  S2 → {response_data['ticketNumber']} status={response_data['status']} pos={response_data['position']} onWaitlist={response_data['onWaitlist']} est={response_data['estimatedMinutesRemaining']}min\")
"
STATUS2=$(echo "$S2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$STATUS2" = "WAITLISTED" ] && ok "S2 waitlisted ✓" || fail "Expected WAITLISTED, got $STATUS2"

# ---------- ESTIMATE ----------
step "7. Estimate endpoint"
curl -s $BASE/api/queues/1/estimate -H "Authorization: Bearer $STUDENT_TOKEN" \
  | python3 -c "
import sys,json
response_data=json.load(sys.stdin)['data']
print(f\"  waiting={response_data['waitingCount']}  waitlist={response_data['waitlistCount']}  isFull={response_data['isFull']}  allowWaitlist={response_data['allowWaitlist']}\")
"
ok "Estimate returned"

# ---------- STAFF SERVES S1 ----------
step "8. Staff completes S1 → S2 should auto-promote"
curl -s -X POST $BASE/api/staff/queues/1/next -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null
curl -s -X POST $BASE/api/staff/tickets/$S1_TID/serve -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null
curl -s -X POST $BASE/api/staff/tickets/$S1_TID/complete -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null
ok "S1 completed"

step "9. Check S2 status"
S2_ACTIVE=$(curl -s $BASE/api/user/tickets/active -H "Authorization: Bearer $STUDENT2_TOKEN")
echo "$S2_ACTIVE" | python3 -c "
import sys,json
response_data=json.load(sys.stdin)['data']
print(f\"  S2 → status={response_data['status']} pos={response_data['position']} onWaitlist={response_data['onWaitlist']} est={response_data['estimatedMinutesRemaining']}min\")
"
S2_STATUS=$(echo "$S2_ACTIVE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$S2_STATUS" = "WAITING" ] && ok "S2 auto-promoted ✓" || fail "Expected WAITING, got $S2_STATUS"

# ---------- NOTIFICATION ----------
step "10. Check S2 got promotion notification"
curl -s $BASE/api/notifications -H "Authorization: Bearer $STUDENT2_TOKEN" \
  | python3 -c "
import sys,json
ns=json.load(sys.stdin)['data']
print(f'  Total: {len(ns)}')
for notification in ns[:3]:
    print(f\"    · [{notification['type']}] {notification['title']}\")
"
ok "Notifications checked"

# ---------- AUDIT LOG ----------
step "11. Audit log shows promotion"
SUPER_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"superadmin@uniqueue.com","password":"super1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -s "$BASE/api/super-admin/audit-logs?action=TICKET_WAITLIST_PROMOTED&size=5" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  | python3 -c "
import sys,json
response_data=json.load(sys.stdin)['data']
print(f\"  Promotions logged: {response_data['totalElements']}\")
for audit_entry in response_data['content'][:3]:
    print(f\"    · {audit_entry['createdAt'][:19]}  {audit_entry['details']}\")
"
ok "Audit checked"

# ---------- RESTORE + CLEANUP ----------
step "12. Restore queue 1 defaults and clean up tickets"
curl -s -X PUT $BASE/api/admin/queues/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"maxCapacity": 100, "allowWaitlist": true, "autoPromoteWaitlist": true, "maxWaitlistSize": 100}' > /dev/null

for TK in "$STUDENT_TOKEN" "$STUDENT2_TOKEN"; do
  TID=$(curl -s $BASE/api/user/tickets/active -H "Authorization: Bearer $TK" \
    | python3 -c "import sys,json; response_data=json.load(sys.stdin)['data']; print(response_data['id'] if response_data else '')")
  [ -n "$TID" ] && curl -s -X DELETE $BASE/api/user/tickets/$TID -H "Authorization: Bearer $TK" > /dev/null
done
ok "Cleanup done"

echo -e "\n${GREEN}━━━ WAITLIST FLOW TEST PASSED 🎉 ━━━${RESET}\n"