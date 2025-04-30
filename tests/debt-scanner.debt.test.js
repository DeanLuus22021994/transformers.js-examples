/**
 * Technical Debt Scanner using Jest Framework
 *
 * This test file scans the codebase for technical debt markers and generates reports.
 * It can be run in watch mode for real-time updates.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const DEBT_MARKERS = [
  '#debt:',
  '#improve:',
  '#refactor:',
  '#fixme:',
  '#todo:',
  'DIR.TAG:'
];

const INCLUDE_PATTERNS = ['**/*.{js,ts,jsx,tsx,css,scss,html,md}'];
const EXCLUDE_PATTERNS = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/debt-reports/**'];
const REPORT_DIR = path.join(process.cwd(), 'debt-reports');

/**
 * Ensure the report directory exists
 */
function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

/**
 * Get all files matching the include patterns and not matching exclude patterns
 */
function getMatchingFiles() {
  let files = [];

  for (const pattern of INCLUDE_PATTERNS) {
    const matches = glob.sync(pattern, {
      ignore: EXCLUDE_PATTERNS,
    });
    files = [...files, ...matches];
  }

  return files;
}

/**
 * Scan a single file for debt markers
 * @param {string} filePath - Path to the file to scan
 * @returns {Array<Object>} - Array of debt items found
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    for (const marker of DEBT_MARKERS) {
      if (line.includes(marker)) {
        const markerIndex = line.indexOf(marker);
        const description = line.substring(markerIndex + marker.length).trim();

        // Handle DIR.TAG format specially
        let tags = [];
        let dirPath = '';

        if (marker === 'DIR.TAG:') {
          const parts = description.split('#');
          dirPath = parts[0].trim();

          // Extract tags
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].trim()) {
              tags.push('#' + parts[i].trim());
            }
          }
        }

        results.push({
          filePath,
          lineNumber: index + 1,
          marker,
          description,
          dirPath,
          tags
        });
      }
    }
  });

  return results;
}

/**
 * Generate a markdown report from scan results
 * @param {Array<Object>} results - Scan results
 * @returns {string} - Markdown report content
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(REPORT_DIR, `debt-report-${timestamp}.md`);

  let report = '# Technical Debt Report\n\n';
  report += `Generated on ${new Date().toISOString()}\n\n`;
  report += '## Debt Markers Found\n\n';

  // Group by marker type
  const groupedResults = {};
  for (const result of results) {
    if (!groupedResults[result.marker]) {
      groupedResults[result.marker] = [];
    }
    groupedResults[result.marker].push(result);
  }

  // Generate report sections by marker type
  for (const marker in groupedResults) {
    report += `### ${marker} Items\n\n`;
    report += '| File | Line | Description |\n';
    report += '|------|------|-------------|\n';

    for (const item of groupedResults[marker]) {
      const relativePath = path.relative(process.cwd(), item.filePath);
      let description = item.description;

      // Format DIR.TAG items specially
      if (marker === 'DIR.TAG:') {
        description = `${item.dirPath} ${item.tags.join(' ')}`;
      }

      report += `| [${relativePath}](${relativePath}#L${item.lineNumber}) | ${item.lineNumber} | ${description} |\n`;
    }

    report += '\n';
  }

  // Add summary
  report += '## Summary\n\n';
  report += `Total debt items found: ${results.length}\n\n`;

  // Add recommendations
  if (results.length > 0) {
    report += '## Recommendations\n\n';

    if (results.length > 50) {
      report += '- **High Priority:** Schedule a dedicated debt reduction sprint\n';
    } else if (results.length > 20) {
      report += '- **Medium Priority:** Allocate 20% of sprint capacity to debt reduction\n';
    } else {
      report += '- **Low Priority:** Continue addressing debt items as part of regular development\n';
    }
  }

  // Write report to file
  fs.writeFileSync(reportPath, report);

  return reportPath;
}

/**
 * Run the debt scanner and create a report
 */
function runScanner() {
  ensureReportDir();
  const files = getMatchingFiles();
  let allResults = [];

  files.forEach(file => {
    const results = scanFile(file);
    allResults = [...allResults, ...results];
  });

  const reportPath = generateReport(allResults);

  console.log(`Found ${allResults.length} technical debt items`);
  console.log(`Report generated: ${reportPath}`);

  return { results: allResults, reportPath };
}

describe('Technical Debt Scanner', () => {
  let results;
  let reportPath;

  beforeAll(() => {
    const scanResult = runScanner();
    results = scanResult.results;
    reportPath = scanResult.reportPath;
  });

  test('should generate a debt report', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  test('should find technical debt items', () => {
    console.log(`Total debt items found: ${results.length}`);
    console.table(results.slice(0, 10)); // Display first 10 results

    // This test always passes, but outputs the debt count
    expect(true).toBe(true);
  });

  // This creates a test for each debt item found
  results && results.forEach((item, index) => {
    // Only create individual tests for first 100 items to avoid test explosion
    if (index < 100) {
      test(`Debt item #${index + 1}: ${item.filePath}:${item.lineNumber}`, () => {
        console.log(`${item.marker} ${item.description}`);
        expect(item).toHaveProperty('filePath');
        expect(item).toHaveProperty('lineNumber');
      });
    }
  });
});
