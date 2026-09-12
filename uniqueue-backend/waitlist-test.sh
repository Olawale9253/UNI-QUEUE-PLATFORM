#!/bin/bash
# UniQueue — Waitlist Flow Test
set -e
BASE="http://localhost:8080"
G="\033[0;32m"; R="\033[0;31m"; Y="\033[0;33m"; N="\033[0m"
ok()   { echo -e "${G}✅ $1${N}"; }
fail() { echo -e "${R}❌ $1${N}"; exit 1; }
step() { echo -e "\n${Y}━━━ $1 ━━━${N}"; }

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
d=json.load(sys.stdin)
print('  Registered' if d.get('success') else f\"  Already exists: {d.get('message')}\")
"

STUDENT2_TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student2@unilag.edu.ng","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
ok "Student2 logged in"

# ---------- CLEAR EXISTING TICKETS ----------
step "3. Clear any existing active tickets"
for TK in "$STUDENT_TOKEN" "$STUDENT2_TOKEN"; do
  TID=$(curl -s $BASE/api/user/tickets/active -H "Authorization: Bearer $TK" \
    | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['id'] if d else '')")
  [ -n "$TID" ] && curl -s -X DELETE $BASE/api/user/tickets/$TID -H "Authorization: Bearer $TK" > /dev/null
done
ok "Cleared"

# ---------- ENABLE WAITLIST ----------
step "4. Enable waitlist on Bursary (cap=1, waitlist=5)"
curl -s -X PUT $BASE/api/admin/queues/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"maxCapacity": 1, "allowWaitlist": true, "autoPromoteWaitlist": true, "maxWaitlistSize": 5}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f\"  capacity={d['maxCapacity']} allowWaitlist={d['allowWaitlist']} autoPromote={d['autoPromoteWaitlist']}\")"
ok "Waitlist enabled"

# ---------- S1 JOINS ----------
step "5. Student 1 joins (should be WAITING)"
S1_RESP=$(curl -s -X POST $BASE/api/user/tickets/join -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -d '{"queueId": 1}')
echo "$S1_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f\"  S1 → {d['ticketNumber']} status={d['status']} pos={d['position']} onWaitlist={d['onWaitlist']}\")
"
S1_TID=$(echo "$S1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
ok "S1 joined (ticket id=$S1_TID)"

# ---------- S2 JOINS → WAITLISTED ----------
step "6. Student 2 joins (should be WAITLISTED)"
S2_RESP=$(curl -s -X POST $BASE/api/user/tickets/join -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT2_TOKEN" -d '{"queueId": 1}')
echo "$S2_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f\"  S2 → {d['ticketNumber']} status={d['status']} pos={d['position']} onWaitlist={d['onWaitlist']} est={d['estimatedMinutesRemaining']}min\")
"
STATUS2=$(echo "$S2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
[ "$STATUS2" = "WAITLISTED" ] && ok "S2 waitlisted ✓" || fail "Expected WAITLISTED, got $STATUS2"

# ---------- ESTIMATE ----------
step "7. Estimate endpoint"
curl -s $BASE/api/queues/1/estimate -H "Authorization: Bearer $STUDENT_TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f\"  waiting={d['waitingCount']}  waitlist={d['waitlistCount']}  isFull={d['isFull']}  allowWaitlist={d['allowWaitlist']}\")
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
d=json.load(sys.stdin)['data']
print(f\"  S2 → status={d['status']} pos={d['position']} onWaitlist={d['onWaitlist']} est={d['estimatedMinutesRemaining']}min\")
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
for n in ns[:3]:
    print(f\"    · [{n['type']}] {n['title']}\")
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
d=json.load(sys.stdin)['data']
print(f\"  Promotions logged: {d['totalElements']}\")
for a in d['content'][:3]:
    print(f\"    · {a['createdAt'][:19]}  {a['details']}\")
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
    | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['id'] if d else '')")
  [ -n "$TID" ] && curl -s -X DELETE $BASE/api/user/tickets/$TID -H "Authorization: Bearer $TK" > /dev/null
done
ok "Cleanup done"

echo -e "\n${G}━━━ WAITLIST FLOW TEST PASSED 🎉 ━━━${N}\n"