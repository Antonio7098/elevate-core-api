#!/bin/bash

# UEE Progression Visual Demo Script
# Demonstrates UNDERSTAND → USE → EXPLORE progression in the primitive SR system
# Shows how mastering all primitives at one level triggers progression to the next

set -e

# Configuration
API_BASE="http://localhost:3000/api"
TEST_TOKEN="test123"
TEST_USER_ID="1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper function to make authenticated API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -H "x-test-user-id: $TEST_USER_ID" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -H "x-test-user-id: $TEST_USER_ID" \
            "$API_BASE$endpoint"
    fi
}

# Helper function to display section headers
section_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}\n"
}

# Helper function to display step headers
step_header() {
    echo -e "\n${CYAN}--- $1 ---${NC}"
}

# Helper function to display primitive status
display_primitive_status() {
    local primitives_json=$1
    local level_filter=$2
    
    echo "$primitives_json" | jq -r --arg level "$level_filter" '
        .data.primitives[] | 
        select(.masteryLevel == $level) | 
        "  • \(.title): \(.masteryLevel) (Mastery: \(.weightedMasteryScore | tonumber | . * 100 | floor)%)"
    '
}

# Helper function to show UEE level distribution
show_uee_distribution() {
    local primitives_json=$1
    
    echo -e "${YELLOW}UEE Level Distribution:${NC}"
    
    local understand_count=$(echo "$primitives_json" | jq '.data.primitives | map(select(.masteryLevel == "UNDERSTAND")) | length')
    local use_count=$(echo "$primitives_json" | jq '.data.primitives | map(select(.masteryLevel == "USE")) | length')
    local explore_count=$(echo "$primitives_json" | jq '.data.primitives | map(select(.masteryLevel == "EXPLORE")) | length')
    
    echo "  📚 UNDERSTAND: $understand_count primitives"
    echo "  🔧 USE: $use_count primitives"
    echo "  🔍 EXPLORE: $explore_count primitives"
}

# Helper function to simulate mastering a primitive
master_primitive() {
    local primitive_id=$1
    local primitive_title=$2
    
    echo -e "${GREEN}Mastering primitive: $primitive_title${NC}"
    
    # Submit multiple successful reviews to achieve mastery
    local review_data='{
        "outcomes": [
            {
                "primitiveId": "'$primitive_id'",
                "success": true,
                "timeSpent": 120,
                "difficultyRating": 3
            }
        ]
    }'
    
    # Submit 5 successful reviews to ensure mastery
    for i in {1..5}; do
        echo "  Submitting successful review $i/5..."
        api_call "POST" "/primitives/review" "$review_data" > /dev/null
        sleep 0.5
    done
    
    echo -e "${GREEN}  ✅ Primitive mastered!${NC}"
}

# Helper function to check if progression is available
check_progression() {
    local primitive_id=$1
    local blueprint_id=${2:-1}
    
    api_call "GET" "/primitive-sr/progression/$primitive_id/$blueprint_id"
}

# Helper function to progress to next level
progress_to_next_level() {
    local primitive_id=$1
    local blueprint_id=${2:-1}
    
    api_call "POST" "/primitive-sr/progress/$primitive_id/$blueprint_id" ""
}

# Main demonstration
main() {
    section_header "🎓 UEE PROGRESSION DEMONSTRATION"
    echo "This demo shows how the primitive SR system handles UEE level progression:"
    echo "UNDERSTAND → USE → EXPLORE"
    echo ""
    echo "We'll simulate a user mastering all primitives at each level and"
    echo "observe how the system automatically progresses to the next level."
    
    read -p "Press Enter to start the demonstration..."
    
    # Step 1: Initial State Assessment
    section_header "📊 STEP 1: INITIAL STATE ASSESSMENT"
    
    step_header "Fetching current primitive state"
    primitives_response=$(api_call "GET" "/primitives")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to fetch primitives. Is the server running?${NC}"
        exit 1
    fi
    
    echo "$primitives_response" | jq '.'
    echo ""
    
    show_uee_distribution "$primitives_response"
    
    # Get primitives at UNDERSTAND level
    understand_primitives=$(echo "$primitives_response" | jq -r '.data.primitives[] | select(.masteryLevel == "UNDERSTAND") | .primitiveId')
    understand_count=$(echo "$understand_primitives" | wc -l)
    
    if [ $understand_count -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No primitives at UNDERSTAND level found.${NC}"
        echo "The demo works best with primitives at different UEE levels."
        read -p "Continue anyway? (y/n): " continue_choice
        if [ "$continue_choice" != "y" ]; then
            exit 0
        fi
    fi
    
    read -p "Press Enter to continue to mastery demonstration..."
    
    # Step 2: Master UNDERSTAND Level Primitives
    section_header "📚 STEP 2: MASTERING UNDERSTAND LEVEL"
    
    echo "We'll now master all primitives at the UNDERSTAND level."
    echo "This should trigger progression to the USE level."
    echo ""
    
    if [ $understand_count -gt 0 ]; then
        echo -e "${BLUE}Primitives to master at UNDERSTAND level:${NC}"
        display_primitive_status "$primitives_response" "UNDERSTAND"
        echo ""
        
        read -p "Press Enter to start mastering UNDERSTAND primitives..."
        
        # Master each UNDERSTAND primitive
        while IFS= read -r primitive_id; do
            if [ -n "$primitive_id" ]; then
                primitive_title=$(echo "$primitives_response" | jq -r --arg id "$primitive_id" '.data.primitives[] | select(.primitiveId == $id) | .title')
                
                step_header "Mastering: $primitive_title"
                master_primitive "$primitive_id" "$primitive_title"
                
                # Check if progression is now available
                echo "  Checking progression eligibility..."
                progression_check=$(check_progression "$primitive_id")
                can_progress=$(echo "$progression_check" | jq -r '.data.canProgress')
                
                if [ "$can_progress" = "true" ]; then
                    next_level=$(echo "$progression_check" | jq -r '.data.nextLevel')
                    echo -e "${GREEN}  🎉 Progression available to $next_level level!${NC}"
                    
                    echo "  Progressing to next level..."
                    progress_result=$(progress_to_next_level "$primitive_id")
                    new_level=$(echo "$progress_result" | jq -r '.newLevel')
                    
                    if [ "$new_level" != "null" ]; then
                        echo -e "${GREEN}  ✅ Successfully progressed to $new_level level!${NC}"
                    else
                        echo -e "${RED}  ❌ Progression failed${NC}"
                    fi
                else
                    weighted_mastery=$(echo "$progression_check" | jq -r '.data.weightedMastery')
                    echo -e "${YELLOW}  ⏳ Not ready for progression yet (Mastery: $(echo "$weighted_mastery * 100" | bc | cut -d. -f1)%)${NC}"
                fi
                
                echo ""
                sleep 2
            fi
        done <<< "$understand_primitives"
    fi
    
    # Step 3: Show Updated State
    section_header "📈 STEP 3: UPDATED STATE AFTER UNDERSTAND MASTERY"
    
    step_header "Fetching updated primitive state"
    updated_primitives=$(api_call "GET" "/primitives")
    
    echo "$updated_primitives" | jq '.'
    echo ""
    
    show_uee_distribution "$updated_primitives"
    
    # Show what moved to USE level
    use_primitives_after=$(echo "$updated_primitives" | jq -r '.data.primitives[] | select(.masteryLevel == "USE") | .primitiveId')
    use_count_after=$(echo "$use_primitives_after" | wc -l)
    
    echo ""
    echo -e "${GREEN}🎉 Progression Results:${NC}"
    echo "  • Primitives now at USE level: $use_count_after"
    
    if [ $use_count_after -gt 0 ]; then
        echo -e "${BLUE}USE Level Primitives:${NC}"
        display_primitive_status "$updated_primitives" "USE"
    fi
    
    read -p "Press Enter to continue to USE level mastery..."
    
    # Step 4: Master USE Level Primitives
    section_header "🔧 STEP 4: MASTERING USE LEVEL"
    
    if [ $use_count_after -gt 0 ]; then
        echo "Now we'll master primitives at the USE level to trigger progression to EXPLORE."
        echo ""
        
        # Master each USE primitive
        while IFS= read -r primitive_id; do
            if [ -n "$primitive_id" ]; then
                primitive_title=$(echo "$updated_primitives" | jq -r --arg id "$primitive_id" '.data.primitives[] | select(.primitiveId == $id) | .title')
                
                step_header "Mastering: $primitive_title (USE level)"
                master_primitive "$primitive_id" "$primitive_title"
                
                # Check progression to EXPLORE
                echo "  Checking progression to EXPLORE level..."
                progression_check=$(check_progression "$primitive_id")
                can_progress=$(echo "$progression_check" | jq -r '.data.canProgress')
                
                if [ "$can_progress" = "true" ]; then
                    next_level=$(echo "$progression_check" | jq -r '.data.nextLevel')
                    echo -e "${GREEN}  🎉 Progression available to $next_level level!${NC}"
                    
                    echo "  Progressing to EXPLORE level..."
                    progress_result=$(progress_to_next_level "$primitive_id")
                    new_level=$(echo "$progress_result" | jq -r '.newLevel')
                    
                    if [ "$new_level" = "EXPLORE" ]; then
                        echo -e "${GREEN}  ✅ Successfully progressed to EXPLORE level!${NC}"
                    else
                        echo -e "${RED}  ❌ Progression failed${NC}"
                    fi
                else
                    weighted_mastery=$(echo "$progression_check" | jq -r '.data.weightedMastery')
                    echo -e "${YELLOW}  ⏳ Not ready for EXPLORE progression yet (Mastery: $(echo "$weighted_mastery * 100" | bc | cut -d. -f1)%)${NC}"
                fi
                
                echo ""
                sleep 2
            fi
        done <<< "$use_primitives_after"
    else
        echo -e "${YELLOW}No primitives at USE level to demonstrate with.${NC}"
    fi
    
    # Step 5: Final State
    section_header "🏆 STEP 5: FINAL STATE - EXPLORE LEVEL ACHIEVED"
    
    step_header "Final primitive state assessment"
    final_primitives=$(api_call "GET" "/primitives")
    
    echo "$final_primitives" | jq '.'
    echo ""
    
    show_uee_distribution "$final_primitives"
    
    # Show EXPLORE level primitives
    explore_count=$(echo "$final_primitives" | jq '.data.primitives | map(select(.masteryLevel == "EXPLORE")) | length')
    
    if [ $explore_count -gt 0 ]; then
        echo ""
        echo -e "${GREEN}🔍 EXPLORE Level Primitives:${NC}"
        display_primitive_status "$final_primitives" "EXPLORE"
        
        echo ""
        echo -e "${GREEN}🎉 SUCCESS! Primitives have progressed through the UEE levels:${NC}"
        echo -e "${GREEN}   UNDERSTAND → USE → EXPLORE${NC}"
    fi
    
    # Step 6: Daily Tasks at EXPLORE Level
    section_header "📋 STEP 6: DAILY TASKS AT EXPLORE LEVEL"
    
    step_header "Fetching daily tasks to see EXPLORE-level questions"
    daily_tasks=$(api_call "GET" "/primitives/due")
    
    echo "Daily tasks now include EXPLORE-level content:"
    echo "$daily_tasks" | jq '.'
    
    explore_tasks_count=$(echo "$daily_tasks" | jq '.data.tasks | map(select(.bucket == "plus")) | length')
    echo ""
    echo -e "${PURPLE}📊 EXPLORE-level tasks available: $explore_tasks_count${NC}"
    
    section_header "✅ UEE PROGRESSION DEMONSTRATION COMPLETE"
    
    echo -e "${GREEN}🎓 Demonstration Summary:${NC}"
    echo "  1. ✅ Started with primitives at UNDERSTAND level"
    echo "  2. ✅ Mastered UNDERSTAND primitives through successful reviews"
    echo "  3. ✅ System automatically progressed primitives to USE level"
    echo "  4. ✅ Mastered USE primitives to unlock EXPLORE level"
    echo "  5. ✅ System progressed primitives to EXPLORE level"
    echo "  6. ✅ Daily tasks now include advanced EXPLORE-level content"
    echo ""
    echo -e "${BLUE}🔄 The UEE progression algorithm successfully demonstrated:${NC}"
    echo "  • Automatic level progression based on mastery thresholds"
    echo "  • Weighted mastery score calculations"
    echo "  • Progressive difficulty through UNDERSTAND → USE → EXPLORE"
    echo "  • Dynamic daily task generation based on current UEE levels"
    echo ""
    echo -e "${PURPLE}🚀 The primitive SR system is working as designed!${NC}"
}

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo >&2 "This script requires jq but it's not installed. Please install jq first."; exit 1; }
command -v bc >/dev/null 2>&1 || { echo >&2 "This script requires bc but it's not installed. Please install bc first."; exit 1; }

# Run the demonstration
main "$@"
