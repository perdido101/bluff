import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const LEARNING_FILE = path.join(DATA_DIR, 'learning.json');
const PATTERNS_FILE = path.join(DATA_DIR, 'patterns.json');

export class PersistenceService {
  async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  async saveLearningData(data: any) {
    try {
      await fs.writeFile(LEARNING_FILE, JSON.stringify(data, this.mapReplacer));
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  async loadLearningData() {
    try {
      const data = await fs.readFile(LEARNING_FILE, 'utf-8');
      return JSON.parse(data, this.mapReviver);
    } catch (error) {
      return null;
    }
  }

  async savePatterns(data: any) {
    try {
      await fs.writeFile(PATTERNS_FILE, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save patterns:', error);
    }
  }

  async loadPatterns() {
    try {
      const data = await fs.readFile(PATTERNS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  private mapReplacer(key: string, value: any) {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    }
    return value;
  }

  private mapReviver(key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }
} 