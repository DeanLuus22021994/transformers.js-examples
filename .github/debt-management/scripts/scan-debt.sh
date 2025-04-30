#!/bin/bash
set -e
CONFIG_FILE=.github/debt-management/config/debt-config.yml
REPORT_FILE=.github/reports/dev_debt/debt-report.md
[ -f "$CONFIG_FILE" ] || exit 1
get_config_value(){ grep "$1:" "$CONFIG_FILE" | head -n 1 | sed 's/.*: "\(.*\)".*/\1/'; }
get_array_values(){ grep -A 100 "$1:" "$CONFIG_FILE" | grep -B 100 -m 1 "^[a-z]" | grep "$2" | sed 's/.*- "\(.*\)".*/\1/'; }
mkdir -p $(dirname "$REPORT_FILE")
echo "# Technical Debt Report" > "$REPORT_FILE"
echo "Generated on $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
MARKERS=($(grep -A 100 "markers:" "$CONFIG_FILE" | grep "marker:" | sed 's/.*marker: "\(.*\)".*/\1/'))
[ ${#MARKERS[@]} -eq 0 ] && MARKERS=("#debt:" "#improve:" "#refactor:" "#fixme:" "#todo:")
INCLUDE_PATTERNS=($(get_array_values include_patterns -))
[ ${#INCLUDE_PATTERNS[@]} -eq 0 ] && INCLUDE_PATTERNS=("*.js" "*.ts" "*.jsx" "*.tsx" "*.css" "*.scss" "*.html")
EXCLUDE_DIRS=$(get_array_values exclude_patterns - | tr '\n' ',' | sed 's/,$//')
[ -z "$EXCLUDE_DIRS" ] && EXCLUDE_DIRS="node_modules,dist,build,.git"
EXCLUDE_PATTERN=$(echo "$EXCLUDE_DIRS" | sed 's/,/\\|/g')
TOTAL_COUNT=0
DEBT_ITEMS=()
echo "## Debt Markers Found" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
for MARKER in "${MARKERS[@]}"; do
    echo "### ${MARKER} Items" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    PATTERN_STRING=$(printf " --include=\"%s\"" "${INCLUDE_PATTERNS[@]}")
    GREP_CMD="grep -r $PATTERN_STRING --exclude-dir={$EXCLUDE_DIRS} \"${MARKER}\" ."
    RESULTS=$(eval "$GREP_CMD" || echo "")
    if [ -z "$RESULTS" ]; then
        echo "No items found." >> "$REPORT_FILE"
    else
        echo "| File | Line | Description |" >> "$REPORT_FILE"
        echo "|------|------|-------------|" >> "$REPORT_FILE"
        while IFS=: read -r file linenum content; do
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
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Total debt items found: $TOTAL_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Debt by Directory" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
if [ $TOTAL_COUNT -gt 0 ]; then
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
    for dir in "${!dir_counts[@]}"; do
        count=${dir_counts["$dir"]}
        percentage=$(echo "scale=1; ($count * 100) / $TOTAL_COUNT" | bc)
        echo "| $dir | $count | ${percentage}% |" >> "$REPORT_FILE"
    done | sort -k3 -rn | head -n 10 >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE"


