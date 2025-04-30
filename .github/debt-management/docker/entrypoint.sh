#!/bin/bash
# Docker container entrypoint

echo "╔════════════════════════════════════════╗"
echo "║       Technical Debt Scanner           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Mount repository directory as volume
if [ ! -d "/repo" ]; then
    echo "Error: Repository directory not found at /repo"
    echo "Please mount your repository volume correctly"
    echo "Example: docker run -v \$(pwd):/repo debt-scanner"
    exit 1
fi

# Create output directory
mkdir -p /repo/debt-reports

# Run the scanner
cd /repo
echo "Running debt scanner..."
scan-debt

# Generate report
echo ""
echo "Generating comprehensive report..."
generate-report

echo ""
echo "Done! Reports available in the repository root:"
echo "- debt-report.md: Raw scan results"
echo "- debt-weekly-report.md: Weekly summary with trends and recommendations"
