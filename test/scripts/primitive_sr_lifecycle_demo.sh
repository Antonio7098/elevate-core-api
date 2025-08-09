#!/bin/bash

# ==============================================================================
# Elevate Core API - Primitive Spaced Repetition Lifecycle Demo
# ==============================================================================
#
# This script demonstrates the full lifecycle of a user interacting with the
# primitive-based spaced repetition system. It makes live API calls to a
# running instance of the application.
#
# Prerequisites:
# 1. The Elevate Core API server must be running.
# 2. `jq` must be installed for pretty-printing JSON: `sudo apt-get install jq`
# 3. A test user and associated primitive data must be seeded. The script
#    assumes the data from `primitive-lifecycle.e2e.test.ts` exists.

# --- Configuration ---
BASE_URL="http://localhost:3000/api"
# Special test token that bypasses JWT verification in test environments
AUTH_TOKEN="test1234"
# The test user ID to use for all requests
USER_ID="1"
# The ID of the primitive we will be testing with
# This should match the primitive seeded in the e2e test (e.g., 'React Hooks')
PRIMITIVE_ID="primitive-e2e-1"

# --- Helper Function ---
# Function to make and print API calls
function call_api {
  local method=$1
  local endpoint=$2
  local payload=$3
  local description=$4

  echo "----------------------------------------------------------------------"
  echo "=> ${description}"
  echo "   ${method} ${BASE_URL}${endpoint}"
  echo "----------------------------------------------------------------------"

  if [ -z "$payload" ]; then
    curl -s -i -X ${method} \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -H "x-test-user-id: ${USER_ID}" \
      "${BASE_URL}${endpoint}" | awk '/^{/ {p=1} p' | jq
  else
    echo "Payload:"
    echo ${payload} | jq
    curl -s -i -X ${method} \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -H "x-test-user-id: ${USER_ID}" \
      -d "${payload}" 
      "${BASE_URL}${endpoint}" | awk '/^{/ {p=1} p' | jq
  fi
  echo ""
  echo "Press [Enter] to continue..."
  read
}

# ==============================================================================
# SCRIPT EXECUTION STARTS HERE
# ==============================================================================

clear
echo "🚀 Starting Primitive SR Lifecycle Demo..."

# --- 1. Initial State ---
call_api "GET" "/primitives/${PRIMITIVE_ID}/details" "" "Fetching initial state of primitive '${PRIMITIVE_ID}'"

# --- 2. Fetching Daily Tasks (Cache MISS) ---
call_api "GET" "/primitives/due" "" "Fetching daily tasks (expect X-Cache: MISS)"

# --- 3. Fetching Daily Tasks (Cache HIT) ---
call_api "GET" "/primitives/due" "" "Fetching daily tasks again (expect X-Cache: HIT)"

# --- 4. Successful Review ---
# We simulate a correct answer (difficultyRating: 5). This should increase the
# mastery score and push the next review date further into the future.
REVIEW_PAYLOAD_SUCCESS='{"outcomes":[{"primitiveId":"'${PRIMITIVE_ID}'","criterionId":"criterion-e2e-1-1","questionId":"question-e2e-1-1","difficultyRating":5}]}'
call_api "POST" "/primitives/review" "${REVIEW_PAYLOAD_SUCCESS}" "Submitting a SUCCESSFUL review outcome"

# --- 5. Check State After Success ---
call_api "GET" "/primitives/${PRIMITIVE_ID}/details" "" "Fetching state after successful review. Note the updated 'nextReviewAt' and 'masteryLevel'."

# --- 6. Failed Review ---
# Now, we simulate an incorrect answer (difficultyRating: 1). This will decrease
# the mastery score and schedule the next review for sooner.
REVIEW_PAYLOAD_FAIL='{"outcomes":[{"primitiveId":"'${PRIMITIVE_ID}'","criterionId":"criterion-e2e-1-1","questionId":"question-e2e-1-1","difficultyRating":1}]}'
call_api "POST" "/primitives/review" "${REVIEW_PAYLOAD_FAIL}" "Submitting a FAILED review outcome"

# --- 7. Check State After Failure ---
call_api "GET" "/primitives/${PRIMITIVE_ID}/details" "" "Fetching state after failed review. 'nextReviewAt' should be sooner."

# --- 8. Disable Tracking ---
call_api "POST" "/primitives/${PRIMITIVE_ID}/tracking" "" "Disabling tracking for the primitive"

# --- 9. Verify Tracking is Disabled ---
call_api "GET" "/primitives/due" "" "Fetching daily tasks. The primitive should now be GONE."
call_api "GET" "/primitives/${PRIMITIVE_ID}/details" "" "Fetching details. Note 'nextReviewAt' is null."

# --- 10. Re-enable Tracking ---
call_api "POST" "/primitives/${PRIMITIVE_ID}/tracking" "" "Re-enabling tracking for the primitive"

# --- 11. Verify Tracking is Re-enabled ---
call_api "GET" "/primitives/due" "" "Fetching daily tasks. The primitive should be back."
call_api "GET" "/primitives/${PRIMITIVE_ID}/details" "" "Fetching details. Note 'nextReviewAt' is now set again."

echo "✅ Demo complete!"
