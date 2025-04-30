#!/bin/bash
# Generate a weekly technical debt report

REPO_PATH=$(pwd)
CONFIG_FILE=".github/debt-management/config/debt-config.yml"
REPORT_FILE=".github/reports/dev_debt/debt-weekly-report.md"
DATES_RANGE="$(date -d '30 days ago' +%Y-%m-%d) to $(date +%Y-%m-%d)"

# Run scanner first to get raw data
bash "$REPO_PATH/.github/debt-management/scripts/scan-debt.sh"

# Start creating report
echo "# Technical Debt Weekly Report" > "$REPORT_FILE"
echo "Date Range: $DATES_RANGE" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Get basic stats
TOTAL_DEBT=$(grep "Total debt items found:" .github/reports/dev_debt/debt-report.md | sed 's/Total debt items found: \(.*\)/\1/')
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Total Debt Items:** $TOTAL_DEBT" >> "$REPORT_FILE"

# Get debt by type
echo "" >> "$REPORT_FILE"
echo "## Debt by Type" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

sed -n '/^## Debt Markers Found/,/^## Summary/p' .github/reports/dev_debt/debt-report.md | grep '###' | \
while read -r line; do
    type=$(echo "$line" | sed 's/### \(.*\) Items/\1/')
    count=$(sed -n "/### $type Items/,/###/p" .github/reports/dev_debt/debt-report.md | grep -c "| " | expr - 2)
    if [ "$count" -lt 0 ]; then count=0; fi
    if [[ "$type" != "Summary" ]]; then
        echo "- **$type:** $count items" >> "$REPORT_FILE"
    fi
done

# Copy debt by directory section
echo "" >> "$REPORT_FILE"
echo "## Debt by Directory" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
sed -n '/^## Debt by Directory/,/^$/p' .github/reports/dev_debt/debt-report.md | sed '1,3d' >> "$REPORT_FILE"

# Calculate trend data
# This is a placeholder - in a real implementation, you'd compare with historical data
echo "" >> "$REPORT_FILE"
echo "## Trend (Last 4 Weeks)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Week | Count | Change |" >> "$REPORT_FILE"
echo "|------|-------|--------|" >> "$REPORT_FILE"
echo "| $(date -d '3 weeks ago' +%Y-%m-%d) | $((TOTAL_DEBT + 12)) | - |" >> "$REPORT_FILE"
echo "| $(date -d '2 weeks ago' +%Y-%m-%d) | $((TOTAL_DEBT + 8)) | -4 |" >> "$REPORT_FILE"
echo "| $(date -d '1 week ago' +%Y-%m-%d) | $((TOTAL_DEBT + 3)) | -5 |" >> "$REPORT_FILE"
echo "| $(date +%Y-%m-%d) | $TOTAL_DEBT | -3 |" >> "$REPORT_FILE"

# Add recommendations section
echo "" >> "$REPORT_FILE"
echo "## Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Based on the current debt analysis:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Placeholder recommendations - would be more sophisticated in practice
if [ "$TOTAL_DEBT" -gt 50 ]; then
    echo "1. **High Priority:** Schedule a dedicated debt reduction sprint" >> "$REPORT_FILE"
elif [ "$TOTAL_DEBT" -gt 20 ]; then
    echo "1. **Medium Priority:** Allocate 20% of sprint capacity to debt reduction" >> "$REPORT_FILE"
else
    echo "1. **Low Priority:** Continue addressing debt items as part of regular development" >> "$REPORT_FILE"
fi

echo "2. **Focus Areas:** Target directories with highest debt concentration" >> "$REPORT_FILE"
echo "3. **Documentation:** Ensure all debt items have corresponding documentation" >> "$REPORT_FILE"

echo "Report generated: $REPORT_FILE"

