// Jest watch plugin for DIR.TAG files
// This script integrates with Jest to monitor DIR.TAG changes and
// trigger appropriate automation

/**
 * DIR.TAG Watch Plugin for Jest
 *
 * This plugin monitors changes to DIR.TAG files and triggers appropriate
 * automation based on detected changes.
 */
class DirTagWatchPlugin {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.isWatching = false;
    this.dirTagFiles = new Set();
    this.hasTriggeredInitialScan = false;
  }

  // Hook into Jest's file system watcher
  apply(jestHooks) {
    jestHooks.onFileChange(({ projects }) => {
      this.scanForDirTags(projects);
    });

    jestHooks.onTestRunComplete(() => {
      if (!this.hasTriggeredInitialScan) {
        this.hasTriggeredInitialScan = true;
        console.log('\n[DIR.TAG] Performing initial scan for DIR.TAG files...');
        this.scanForDirTags();
      }
    });
  }

  // Scan for DIR.TAG files
  async scanForDirTags(projects) {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    try {
      // Use git to find DIR.TAG files (faster than fs walk)
      const { stdout } = await exec('git ls-files "**/DIR.TAG"', { cwd: this.rootDir });
      const currentDirTags = new Set(
        stdout.split('\n').filter(Boolean).map(file => path.join(this.rootDir, file))
      );

      // Check for new or modified DIR.TAG files
      const newDirTags = [...currentDirTags].filter(file => !this.dirTagFiles.has(file));
      const modifiedDirTags = [...this.dirTagFiles].filter(file => {
        return currentDirTags.has(file) && fs.existsSync(file);
      });

      // Update tracked DIR.TAG files
      this.dirTagFiles = currentDirTags;

      // Process new or modified DIR.TAG files
      if (newDirTags.length > 0) {
        console.log(`\n[DIR.TAG] Found ${newDirTags.length} new DIR.TAG files`);
        this.processDirTagFiles(newDirTags);
      }

      if (modifiedDirTags.length > 0) {
        console.log(`\n[DIR.TAG] Detected changes in ${modifiedDirTags.length} DIR.TAG files`);
        this.processDirTagFiles(modifiedDirTags);
      }

    } catch (error) {
      console.error('[DIR.TAG] Error scanning for DIR.TAG files:', error);
    }
  }

  // Process DIR.TAG files and trigger appropriate actions
  async processDirTagFiles(files) {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    for (const file of files) {
      try {
        if (!fs.existsSync(file)) continue;

        const content = fs.readFileSync(file, 'utf8');
        const tags = this.extractTags(content);
        const category = tags.find(tag => !tag.startsWith('#p'));
        const priority = tags.find(tag => tag.startsWith('#p'));

        console.log(`\n[DIR.TAG] Processing: ${path.relative(this.rootDir, file)}`);
        console.log(`  - Category: ${category || 'unspecified'}`);
        console.log(`  - Priority: ${priority || 'unspecified'}`);

        // Trigger actions based on tags
        if (category === '#testing') {
          console.log('  - Action: Scaffolding tests');
          await this.scaffoldTests(file);
        }

        // Update debt tracking system
        await this.updateDebtTracking(file, content, category, priority);

      } catch (error) {
        console.error(`[DIR.TAG] Error processing ${file}:`, error);
      }
    }
  }

  // Extract hashtags from DIR.TAG content
  extractTags(content) {
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    const matches = content.match(tagRegex);
    return matches || [];
  }

  // Scaffold tests based on DIR.TAG file
  async scaffoldTests(dirTagFile) {
    const path = require('path');
    const fs = require('fs');

    // Get the directory containing the DIR.TAG file
    const dirTagDir = path.dirname(dirTagFile);

    // Find all .js/.ts files in that directory
    const files = fs.readdirSync(dirTagDir)
      .filter(file => /\.(js|ts|tsx|jsx)$/.test(file))
      .filter(file => !file.endsWith('.test.js') && !file.endsWith('.test.ts'));

    for (const file of files) {
      const filePath = path.join(dirTagDir, file);
      const testFileName = file.replace(/\.(js|ts|tsx|jsx)$/, '.test.$1');
      const testFilePath = path.join(dirTagDir, '__tests__', testFileName);

      // Ensure the __tests__ directory exists
      const testDir = path.join(dirTagDir, '__tests__');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Skip if test file already exists
      if (fs.existsSync(testFilePath)) {
        console.log(`  - Test file already exists: ${testFilePath}`);
        continue;
      }

      // Generate basic test scaffolding
      const content = fs.readFileSync(filePath, 'utf8');
      const moduleExportsMatch = content.match(/module\.exports\s*=\s*{([^}]*)}/);
      const exportMatch = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/);

      let exportedName = '';
      if (moduleExportsMatch) {
        const exports = moduleExportsMatch[1].trim().split(',')[0].trim();
        exportedName = exports;
      } else if (exportMatch) {
        exportedName = exportMatch[1];
      }

      const testTemplate = `
// Auto-generated test scaffold from DIR.TAG #testing
describe('${exportedName || path.basename(file, path.extname(file))}', () => {
  test('should be properly implemented', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });
});
`;

      fs.writeFileSync(testFilePath, testTemplate.trim());
      console.log(`  - Generated test scaffold: ${testFilePath}`);
    }
  }

  // Update debt tracking system
  async updateDebtTracking(file, content, category, priority) {
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    // Skip if debt management scripts don't exist
    const scanScriptPath = path.join(this.rootDir, '.github/debt-management/scripts/scan-debt.sh');
    const scriptExists = require('fs').existsSync(scanScriptPath);
    if (!scriptExists) {
      console.log('  - Skipping debt tracking update (scan-debt.sh not found)');
      return;
    }

    try {
      // Run debt scanning script to update reports
      console.log('  - Updating debt tracking system...');
      await exec('bash .github/debt-management/scripts/scan-debt.sh', { cwd: this.rootDir });
      console.log('  - Debt tracking system updated');
    } catch (error) {
      console.error('  - Error updating debt tracking:', error.message);
    }
  }

  // Cleanup method called when Jest watch is stopped
  getUsageInfo() {
    return {
      key: 'd',
      prompt: 'scan DIR.TAG files',
    };
  }

  // Handle key press 'd' to manually trigger a DIR.TAG scan
  run() {
    console.log('\n[DIR.TAG] Manually scanning DIR.TAG files...');
    this.scanForDirTags();
    return Promise.resolve();
  }
}

module.exports = DirTagWatchPlugin;
