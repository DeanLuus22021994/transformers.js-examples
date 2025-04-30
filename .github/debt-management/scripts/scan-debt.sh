#!/bin/bash
# Technical Debt Scanner Script

# Load configuration
CONFIG_FILE=".github/debt-management/config/debt-config.yml"
REPORT_FILE=".github/reports/dev_debt/debt-report.md"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

# Parse config values using grep and sed (basic parsing)
function get_config_value() {
    grep "$1:" "$CONFIG_FILE" | head -n 1 | sed 's/.*: "\(.*\)".*/\1/'
}

function get_array_values() {
    local section=$1
    local marker=$2
    grep -A 100 "$section:" "$CONFIG_FILE" | grep -B 100 -m 1 "^[a-z]" | grep "$marker" | sed 's/.*- "\(.*\)".*/\1/'
}

echo "# Technical Debt Report" > "$REPORT_FILE"
echo "Generated on $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Get markers from config
MARKERS=($(grep -A 100 "markers:" "$CONFIG_FILE" | grep "marker:" | sed 's/.*marker: "\(.*\)".*/\1/'))
if [ ${#MARKERS[@]} -eq 0 ]; then
    MARKERS=("#debt:" "#improve:" "#refactor:" "#fixme:" "#todo:")
    echo "Using default markers: ${MARKERS[*]}"
else
    echo "Using configured markers: ${MARKERS[*]}"
fi

# Get file patterns
INCLUDE_PATTERNS=($(get_array_values "include_patterns" "-"))
if [ ${#INCLUDE_PATTERNS[@]} -eq 0 ]; then
    INCLUDE_PATTERNS=("*.js" "*.ts" "*.jsx" "*.tsx" "*.css" "*.scss" "*.html")
    echo "Using default include patterns: ${INCLUDE_PATTERNS[*]}"
fi

# Get exclude patterns
EXCLUDE_DIRS=$(get_array_values "exclude_patterns" "-" | tr '\n' ',' | sed 's/,$//')
if [ -z "$EXCLUDE_DIRS" ]; then
    EXCLUDE_DIRS="node_modules,dist,build,.git"
    echo "Using default exclude directories: $EXCLUDE_DIRS"
fi

# Convert exclude dirs to grep exclude pattern
EXCLUDE_PATTERN=$(echo "$EXCLUDE_DIRS" | sed 's/,/\\|/g')

TOTAL_COUNT=0
DEBT_ITEMS=()

echo "## Debt Markers Found" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Scan each marker
for MARKER in "${MARKERS[@]}"; do
    echo "### ${MARKER} Items" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Include patterns as a string for grep
    PATTERN_STRING=$(printf " --include=\"%s\"" "${INCLUDE_PATTERNS[@]}")
    
    # Find files with markers, excluding specified directories
    GREP_CMD="grep -r $PATTERN_STRING --exclude-dir={$EXCLUDE_DIRS} \"${MARKER}\" ."
    echo "Running: $GREP_CMD"
    
    RESULTS=$(eval "$GREP_CMD" || echo "")
    
    if [ -z "$RESULTS" ]; then
        echo "No items found." >> "$REPORT_FILE"
    else
        echo "| File | Line | Description |" >> "$REPORT_FILE"
        echo "|------|------|-------------|" >> "$REPORT_FILE"
        
        while IFS=: read -r file linenum content; do
            # Extract description after marker
            description=$(echo "$content" | sed -n "s/.*${MARKER}\(.*\)/\1/p" | sed 's/^ *//')
            if [ -z "$description" ]; then
                description=$(echo "$content" | sed "s/.*${MARKER}.*//" | sed 's/^ *//')
            fi
            echo "| $file | $linenum | $description |" >> "$REPORT_FILE"
            TOTAL_COUNT=$((TOTAL_COUNT + 1))
            DEBT_ITEMS+=("$file:$linenum:$MARKER:$description")
        done <<< "$(echo "$RESULTS" | grep -n "." | sed 's/^\([0-9]*\):\(.*\):\(.*\)/\2:\1:\3/')"
    fi
    
    echo "" >> "$REPORT_FILE"
done

# Add summary
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Total debt items found: $TOTAL_COUNT" >> "$REPORT_FILE"

# Add statistics by directory
echo "" >> "$REPORT_FILE"
echo "## Debt by Directory" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $TOTAL_COUNT -gt 0 ]; then
    # Count by directory
    echo "| Directory | Count | Percentage |" >> "$REPORT_FILE"
    echo "|-----------|-------|------------|" >> "$REPORT_FILE"
    
    declare -A dir_counts
    
    for item in "${DEBT_ITEMS[@]}"; do
        file=$(echo "$item" | cut -d':' -f1)
        dir=$(dirname "$file")
        if [ -z "${dir_counts[$dir]}" ]; then
            dir_counts["$dir"]=1
        else
            dir_counts["$dir"]=$((dir_counts["$dir"] + 1))
        fi
    done
    
    # Sort directories by count (highest first)
    for dir in "${!dir_counts[@]}"; do
        count=${dir_counts["$dir"]}
        percentage=$(echo "scale=1; ($count * 100) / $TOTAL_COUNT" | bc)
        echo "| $dir | $count | ${percentage}% |" >> "$REPORT_FILE"
    done | sort -k3 -rn | head -n 10 >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE"
echo "Done."

