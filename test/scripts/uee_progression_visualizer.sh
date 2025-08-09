#!/bin/bash

# Interactive UEE Progression Visualizer
# Provides detailed visual feedback for UNDERSTAND → USE → EXPLORE progression
# Shows mastery thresholds, progression criteria, and algorithm decisions

set -e

# Configuration
API_BASE="http://localhost:3000/api"
TEST_TOKEN="test123"
TEST_USER_ID="1"

# Colors and symbols
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Unicode symbols
CHECKMARK="✅"
CROSS="❌"
ARROW="→"
STAR="⭐"
BOOK="📚"
TOOL="🔧"
SEARCH="🔍"
PROGRESS="📈"
TARGET="🎯"

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

# Visual progress bar
show_progress_bar() {
    local current=$1
    local total=$2
    local width=30
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    
    printf "["
    for ((i=0; i<filled; i++)); do printf "█"; done
    for ((i=filled; i<width; i++)); do printf "░"; done
    printf "] %d%% (%d/%d)\n" $percentage $current $total
}

# Display UEE level with visual indicator
show_uee_level() {
    local level=$1
    case $level in
        "UNDERSTAND")
            echo -e "${BOOK} ${BLUE}UNDERSTAND${NC} - Foundation knowledge"
            ;;
        "USE")
            echo -e "${TOOL} ${YELLOW}USE${NC} - Practical application"
            ;;
        "EXPLORE")
            echo -e "${SEARCH} ${GREEN}EXPLORE${NC} - Advanced mastery"
            ;;
        *)
            echo -e "${CROSS} ${RED}$level${NC} - Unknown level"
            ;;
    esac
}

# Show mastery threshold visualization
show_mastery_threshold() {
    local current_mastery=$1
    local threshold=${2:-0.7}
    local level_name=$3
    
    echo -e "\n${TARGET} ${BOLD}Mastery Analysis for $level_name:${NC}"
    
    # Convert to percentage
    local current_pct=$(echo "$current_mastery * 100" | bc -l | cut -d. -f1)
    local threshold_pct=$(echo "$threshold * 100" | bc -l | cut -d. -f1)
    
    echo -e "Current Mastery: ${CYAN}$current_pct%${NC}"
    echo -e "Required Threshold: ${YELLOW}$threshold_pct%${NC}"
    
    # Visual bar
    local bar_width=40
    local current_bar=$(echo "$current_mastery * $bar_width" | bc -l | cut -d. -f1)
    local threshold_bar=$(echo "$threshold * $bar_width" | bc -l | cut -d. -f1)
    
    printf "Progress: ["
    for ((i=0; i<current_bar; i++)); do 
        if [ $i -lt $threshold_bar ]; then
            printf "${GREEN}█${NC}"
        else
            printf "${BLUE}█${NC}"
        fi
    done
    for ((i=current_bar; i<threshold_bar; i++)); do printf "${RED}░${NC}"; done
    for ((i=threshold_bar; i<bar_width; i++)); do printf "░"; done
    printf "] "
    
    if (( $(echo "$current_mastery >= $threshold" | bc -l) )); then
        echo -e "${CHECKMARK} ${GREEN}Ready for progression!${NC}"
    else
        local needed=$(echo "($threshold - $current_mastery) * 100" | bc -l | cut -d. -f1)
        echo -e "${CROSS} ${RED}Need $needed% more mastery${NC}"
    fi
}

# Interactive primitive selection
select_primitive_for_demo() {
    local primitives_json=$1
    local target_level=$2
    
    echo -e "\n${PURPLE}Select a primitive at $target_level level for demonstration:${NC}"
    
    # Get primitives at target level
    local primitive_ids=($(echo "$primitives_json" | jq -r --arg level "$target_level" '.data.primitives[] | select(.masteryLevel == $level) | .primitiveId'))
    local primitive_titles=($(echo "$primitives_json" | jq -r --arg level "$target_level" '.data.primitives[] | select(.masteryLevel == $level) | .title'))
    
    if [ ${#primitive_ids[@]} -eq 0 ]; then
        echo -e "${CROSS} ${RED}No primitives found at $target_level level${NC}"
        return 1
    fi
    
    # Display options
    for i in "${!primitive_ids[@]}"; do
        local mastery=$(echo "$primitives_json" | jq -r --arg id "${primitive_ids[$i]}" '.data.primitives[] | select(.primitiveId == $id) | .weightedMasteryScore')
        local mastery_pct=$(echo "$mastery * 100" | bc -l | cut -d. -f1)
        echo "  $((i+1)). ${primitive_titles[$i]} (Mastery: $mastery_pct%)"
    done
    
    echo -n "Enter choice (1-${#primitive_ids[@]}): "
    read choice
    
    if [[ $choice =~ ^[0-9]+$ ]] && [ $choice -ge 1 ] && [ $choice -le ${#primitive_ids[@]} ]; then
        local selected_idx=$((choice-1))
        echo "${primitive_ids[$selected_idx]}"
    else
        echo -e "${CROSS} ${RED}Invalid selection${NC}"
        return 1
    fi
}

# Detailed progression simulation
simulate_progression() {
    local primitive_id=$1
    local primitive_title=$2
    local current_level=$3
    
    echo -e "\n${STAR} ${BOLD}PROGRESSION SIMULATION${NC}"
    echo -e "Primitive: ${CYAN}$primitive_title${NC}"
    show_uee_level "$current_level"
    
    # Get current progression status
    echo -e "\n${PROGRESS} Checking current progression status..."
    local progression_check=$(check_progression "$primitive_id")
    local can_progress=$(echo "$progression_check" | jq -r '.data.canProgress')
    local current_mastery=$(echo "$progression_check" | jq -r '.data.weightedMastery')
    local next_level=$(echo "$progression_check" | jq -r '.data.nextLevel')
    
    show_mastery_threshold "$current_mastery" "0.7" "$current_level"
    
    if [ "$can_progress" = "true" ]; then
        echo -e "\n${CHECKMARK} ${GREEN}Progression criteria met!${NC}"
        echo -e "Next level: $(show_uee_level "$next_level")"
        
        echo -n "Proceed with progression? (y/n): "
        read proceed
        
        if [ "$proceed" = "y" ]; then
            echo -e "\n${ARROW} Progressing to $next_level level..."
            local progress_result=$(progress_to_next_level "$primitive_id")
            local success=$(echo "$progress_result" | jq -r '.success')
            
            if [ "$success" = "true" ]; then
                echo -e "${CHECKMARK} ${GREEN}Successfully progressed to $next_level!${NC}"
                
                # Show updated state
                echo -e "\n${PROGRESS} Updated primitive state:"
                local updated_primitive=$(api_call "GET" "/primitives/$primitive_id/details")
                local new_level=$(echo "$updated_primitive" | jq -r '.data.masteryLevel')
                local new_mastery=$(echo "$updated_primitive" | jq -r '.data.weightedMasteryScore')
                
                show_uee_level "$new_level"
                show_mastery_threshold "$new_mastery" "0.7" "$new_level"
            else
                echo -e "${CROSS} ${RED}Progression failed${NC}"
            fi
        fi
    else
        echo -e "\n${CROSS} ${YELLOW}Progression criteria not met${NC}"
        echo "Need to improve mastery through successful reviews."
        
        echo -n "Simulate mastery improvement? (y/n): "
        read simulate
        
        if [ "$simulate" = "y" ]; then
            simulate_mastery_improvement "$primitive_id" "$primitive_title"
        fi
    fi
}

# Simulate mastery improvement through reviews
simulate_mastery_improvement() {
    local primitive_id=$1
    local primitive_title=$2
    
    echo -e "\n${STAR} ${BOLD}MASTERY IMPROVEMENT SIMULATION${NC}"
    echo "Submitting successful reviews to improve mastery..."
    
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
    
    for i in {1..5}; do
        echo -e "\n${ARROW} Review $i/5:"
        api_call "POST" "/primitives/review" "$review_data" > /dev/null
        
        # Check updated mastery
        local progression_check=$(check_progression "$primitive_id")
        local current_mastery=$(echo "$progression_check" | jq -r '.data.weightedMastery')
        local can_progress=$(echo "$progression_check" | jq -r '.data.canProgress')
        
        show_mastery_threshold "$current_mastery" "0.7" "Current"
        
        if [ "$can_progress" = "true" ]; then
            echo -e "${CHECKMARK} ${GREEN}Mastery threshold reached after $i reviews!${NC}"
            break
        fi
        
        sleep 1
    done
    
    # Final progression check
    local final_check=$(check_progression "$primitive_id")
    local final_can_progress=$(echo "$final_check" | jq -r '.data.canProgress')
    
    if [ "$final_can_progress" = "true" ]; then
        echo -e "\n${CHECKMARK} ${GREEN}Ready for progression!${NC}"
        simulate_progression "$primitive_id" "$primitive_title" "$(echo "$final_check" | jq -r '.data.currentLevel')"
    else
        echo -e "\n${CROSS} ${YELLOW}Still need more mastery. Try more reviews.${NC}"
    fi
}

# Helper function to check progression
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

# Main interactive demo
main() {
    echo -e "${PURPLE}${BOLD}🎓 INTERACTIVE UEE PROGRESSION VISUALIZER${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo ""
    echo "This tool provides detailed visualization of the UEE progression algorithm:"
    echo -e "  ${BOOK} ${BLUE}UNDERSTAND${NC} ${ARROW} ${TOOL} ${YELLOW}USE${NC} ${ARROW} ${SEARCH} ${GREEN}EXPLORE${NC}"
    echo ""
    echo "Features:"
    echo "  • Visual mastery threshold indicators"
    echo "  • Interactive primitive selection"
    echo "  • Step-by-step progression simulation"
    echo "  • Real-time mastery improvement tracking"
    
    read -p "Press Enter to start..."
    
    # Fetch current state
    echo -e "\n${PROGRESS} Fetching current primitive state..."
    local primitives_response=$(api_call "GET" "/primitives")
    
    if [ $? -ne 0 ]; then
        echo -e "${CROSS} ${RED}Failed to fetch primitives. Is the server running?${NC}"
        exit 1
    fi
    
    # Show current distribution
    echo -e "\n${STAR} ${BOLD}CURRENT UEE DISTRIBUTION:${NC}"
    local understand_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "UNDERSTAND")) | length')
    local use_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "USE")) | length')
    local explore_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "EXPLORE")) | length')
    
    echo -e "  ${BOOK} UNDERSTAND: $understand_count primitives"
    echo -e "  ${TOOL} USE: $use_count primitives"
    echo -e "  ${SEARCH} EXPLORE: $explore_count primitives"
    
    # Interactive menu
    while true; do
        echo -e "\n${PURPLE}${BOLD}CHOOSE AN ACTION:${NC}"
        echo "1. Demonstrate UNDERSTAND → USE progression"
        echo "2. Demonstrate USE → EXPLORE progression"
        echo "3. Show detailed primitive analysis"
        echo "4. Simulate mastery improvement"
        echo "5. Exit"
        
        echo -n "Enter choice (1-5): "
        read action
        
        case $action in
            1)
                if [ $understand_count -gt 0 ]; then
                    local selected_id=$(select_primitive_for_demo "$primitives_response" "UNDERSTAND")
                    if [ $? -eq 0 ]; then
                        local selected_title=$(echo "$primitives_response" | jq -r --arg id "$selected_id" '.data.primitives[] | select(.primitiveId == $id) | .title')
                        simulate_progression "$selected_id" "$selected_title" "UNDERSTAND"
                    fi
                else
                    echo -e "${CROSS} ${RED}No primitives at UNDERSTAND level${NC}"
                fi
                ;;
            2)
                if [ $use_count -gt 0 ]; then
                    local selected_id=$(select_primitive_for_demo "$primitives_response" "USE")
                    if [ $? -eq 0 ]; then
                        local selected_title=$(echo "$primitives_response" | jq -r --arg id "$selected_id" '.data.primitives[] | select(.primitiveId == $id) | .title')
                        simulate_progression "$selected_id" "$selected_title" "USE"
                    fi
                else
                    echo -e "${CROSS} ${RED}No primitives at USE level${NC}"
                fi
                ;;
            3)
                echo -e "\n${STAR} ${BOLD}DETAILED PRIMITIVE ANALYSIS:${NC}"
                echo "$primitives_response" | jq '.data.primitives[] | {
                    title: .title,
                    level: .masteryLevel,
                    mastery: (.weightedMasteryScore * 100 | floor),
                    tracking: .isTracking
                }'
                ;;
            4)
                echo "Select a primitive to improve mastery:"
                local all_primitives=$(echo "$primitives_response" | jq -r '.data.primitives[] | .primitiveId + " " + .title')
                select primitive_info in $all_primitives "Cancel"; do
                    if [ "$primitive_info" = "Cancel" ]; then
                        break
                    elif [ -n "$primitive_info" ]; then
                        local prim_id=$(echo "$primitive_info" | cut -d' ' -f1)
                        local prim_title=$(echo "$primitive_info" | cut -d' ' -f2-)
                        simulate_mastery_improvement "$prim_id" "$prim_title"
                        break
                    fi
                done
                ;;
            5)
                echo -e "${CHECKMARK} ${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${CROSS} ${RED}Invalid choice${NC}"
                ;;
        esac
        
        # Refresh data after actions
        primitives_response=$(api_call "GET" "/primitives")
        understand_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "UNDERSTAND")) | length')
        use_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "USE")) | length')
        explore_count=$(echo "$primitives_response" | jq '.data.primitives | map(select(.masteryLevel == "EXPLORE")) | length')
    done
}

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo >&2 "This script requires jq but it's not installed. Please install jq first."; exit 1; }
command -v bc >/dev/null 2>&1 || { echo >&2 "This script requires bc but it's not installed. Please install bc first."; exit 1; }

# Run the interactive demo
main "$@"
