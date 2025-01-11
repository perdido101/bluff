import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

interface LogRotationConfig {
  maxSize: number;      // in bytes
  maxFiles: number;     // maximum number of archived files
  compress: boolean;    // whether to compress rotated files
}

export class LogRotationService {
  private readonly defaultConfig: LogRotationConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true
  };

  constructor(
    private config: LogRotationConfig = this.defaultConfig,
    private readonly logDir: string = path.join(__dirname, '../../../logs')
  ) {}

  async checkAndRotate(filePath: string): Promise<void> {
    try {
      const stats = await stat(filePath);
      
      if (stats.size >= this.config.maxSize) {
        await this.rotateFile(filePath);
      }
    } catch (error) {
      console.error('Error checking file for rotation:', error);
    }
  }

  private async rotateFile(filePath: string): Promise<void> {
    const baseDir = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      // Rotate existing archived files
      const files = await this.getArchivedFiles(baseDir, baseName);
      await this.manageArchivedFiles(files);

      // Create new archive
      const archivePath = path.join(
        baseDir,
        `${baseName}.${timestamp}`
      );

      await rename(filePath, archivePath);

      if (this.config.compress) {
        await this.compressFile(archivePath);
        await unlink(archivePath);
      }

      // Create new empty log file
      fs.writeFileSync(filePath, '');
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  private async getArchivedFiles(dir: string, baseName: string): Promise<string[]> {
    const files = await readdir(dir);
    return files
      .filter(file => file.startsWith(baseName + '.'))
      .map(file => path.join(dir, file))
      .sort()
      .reverse();
  }

  private async manageArchivedFiles(files: string[]): Promise<void> {
    if (files.length >= this.config.maxFiles) {
      const filesToDelete = files.slice(this.config.maxFiles - 1);
      for (const file of filesToDelete) {
        try {
          await unlink(file);
        } catch (error) {
          console.error(`Error deleting old log file ${file}:`, error);
        }
      }
    }
  }

  private async compressFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath);
      const compressed = await gzip(content);
      await fs.promises.writeFile(`${filePath}.gz`, compressed);
    } catch (error) {
      console.error('Error compressing file:', error);
    }
  }
} 