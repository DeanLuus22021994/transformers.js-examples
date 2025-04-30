#!/bin/bash
# Create GitHub issues from technical debt markers

REPO_PATH=$(pwd)
CONFIG_FILE=".github/debt-management/config/debt-config.yml"
REPORT_FILE=".github/reports/dev_debt/.github/reports/dev_debt/debt-report.md"
ISSUE_TEMPLATE_FILE=".github/debt-management/templates/technical-debt-issue.md"

# Check if personal access token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable not set"
    echo "Please set your GitHub personal access token:"
    echo "export GITHUB_TOKEN=your_token_here"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) not found. Please install it first."
    echo "See: https://cli.github.com/"
    exit 1
fi

# Get repository information
REPO_URL=$(git config --get remote.origin.url)
REPO_NAME=$(echo "$REPO_URL" | sed 's/.*github.com[:/]\(.*\).git/\1/')

echo "Scanning for debt markers and creating issues in $REPO_NAME..."

# Run scanner first to get raw data
bash "$REPO_PATH/.github/debt-management/scripts/scan-debt.sh"

# Read debt markers
declare -A existing_issues
MARKERS=()

# Get markers from config
MARKERS=($(grep -A 100 "markers:" "$CONFIG_FILE" | grep "marker:" | sed 's/.*marker: "\(.*\)".*/\1/'))
if [ ${#MARKERS[@]} -eq 0 ]; then
    MARKERS=("#debt:" "#improve:" "#refactor:" "#fixme:" "#todo:")
fi

# Check existing issues to avoid duplicates
echo "Checking existing issues..."
existing_issues_json=$(gh issue list --repo "$REPO_NAME" --label "technical-debt" --json title,body --limit 100)
if [ $? -ne 0 ]; then
    echo "Error fetching existing issues. Please check your token and permissions."
    exit 1
fi

# Process the report file to extract debt items
echo "Processing debt items from report..."
while IFS= read -r line; do
    # Look for table rows with debt items
    if [[ "$line" =~ \|\ ([^|]+)\ \|\ ([^|]+)\ \|\ ([^|]+)\ \| ]]; then
        file="${BASH_REMATCH[1]}"
        line_num="${BASH_REMATCH[2]}"
        desc="${BASH_REMATCH[3]}"
        
        # Skip header rows
        if [[ "$file" == "File" || "$file" =~ ^-+$ ]]; then
            continue
        fi
        
        # Trim whitespace
        file=$(echo "$file" | xargs)
        line_num=$(echo "$line_num" | xargs)
        desc=$(echo "$desc" | xargs)
        
        # Skip if empty
        if [ -z "$file" ] || [ -z "$line_num" ] || [ -z "$desc" ]; then
            continue
        fi
        
        # Create issue title
        issue_title="[DEBT] $desc"
        issue_title=$(echo "$issue_title" | sed 's/^.*: //')
        issue_title=$(echo "$issue_title" | cut -c 1-80) # Truncate to reasonable length
        
        # Check if issue already exists
        if echo "$existing_issues_json" | grep -q "$issue_title"; then
            echo "Issue already exists: $issue_title"
            continue
        fi
        
        # Create issue body
        issue_body="# Development Debt Issue\n\n"
        issue_body+="## Overview\n$desc\n\n"
        issue_body+="## Location\nFile: \`$file\`\nLine: $line_num\n\n"
        issue_body+="## Priority\n- [ ] High\n- [x] Medium\n- [ ] Low\n\n"
        issue_body+="## Estimated Effort\nTo be determined\n\n"
        issue_body+="## Implementation Notes\nThis issue was automatically generated from code comments.\n\n"
        issue_body+="## Related Files\n- \`$file\`\n"
        
        # Create the issue
        echo "Creating issue: $issue_title"
        gh issue create --repo "$REPO_NAME" \
            --title "$issue_title" \
            --body "$issue_body" \
            --label "technical-debt"
        
        # Add a small delay to avoid API rate limits
        sleep 1
    fi
done < "$REPORT_FILE"

echo "Finished creating issues for technical debt items."


