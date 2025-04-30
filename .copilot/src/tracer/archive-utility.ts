import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Archive utility for managing trace archives
 * Following SRP by focusing only on archive operations
 */
export class ArchiveUtility {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Compress older log files to save space
   */
  public compressOldLogs(olderThanDays: number = 7): void {
    const archiveDir = path.join(this.baseDir, 'archives');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    if (!fs.existsSync(archiveDir)) {
      return;
    }

    const files = fs.readdirSync(archiveDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(archiveDir, file),
        stats: fs.statSync(path.join(archiveDir, file))
      }))
      .filter(file => file.stats.isFile() && file.stats.mtime < cutoffDate);

    for (const file of files) {
      const content = fs.readFileSync(file.path);
      const compressed = zlib.gzipSync(content);
      fs.writeFileSync(`${file.path}.gz`, compressed);
      fs.unlinkSync(file.path);
    }
  }

  /**
   * List all available archives
   */
  public listArchives(): { name: string; size: number; date: Date }[] {
    const archiveDir = path.join(this.baseDir, 'archives');

    if (!fs.existsSync(archiveDir)) {
      return [];
    }

    return fs.readdirSync(archiveDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.json.gz'))
      .map(file => {
        const filePath = path.join(archiveDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Extract session data from an archive
   */
  public extractArchive(archiveName: string): any {
    const archiveDir = path.join(this.baseDir, 'archives');
    const archivePath = path.join(archiveDir, archiveName);

    if (!fs.existsSync(archivePath)) {
      throw new Error(`Archive ${archiveName} not found`);
    }

    let content: Buffer;

    if (archiveName.endsWith('.gz')) {
      content = zlib.gunzipSync(fs.readFileSync(archivePath));
    } else {
      content = fs.readFileSync(archivePath);
    }

    return JSON.parse(content.toString());
  }

  /**
   * Purge old archives to save disk space
   */
  public purgeOldArchives(olderThanDays: number = 30): string[] {
    const archiveDir = path.join(this.baseDir, 'archives');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    if (!fs.existsSync(archiveDir)) {
      return [];
    }

    const deletedFiles: string[] = [];
    const files = fs.readdirSync(archiveDir)
      .map(file => ({
        name: file,
        path: path.join(archiveDir, file),
        stats: fs.statSync(path.join(archiveDir, file))
      }))
      .filter(file => file.stats.isFile() && file.stats.mtime < cutoffDate);

    for (const file of files) {
      fs.unlinkSync(file.path);
      deletedFiles.push(file.name);
    }

    return deletedFiles;
  }
}