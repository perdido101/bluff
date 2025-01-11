import fs from 'fs/promises';
import { PersistenceService } from '../persistenceService';

jest.mock('fs/promises');

describe('PersistenceService', () => {
  let service: PersistenceService;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    service = new PersistenceService();
  });

  test('creates data directory on init', async () => {
    await service.init();
    expect(mockFs.mkdir).toHaveBeenCalled();
  });

  test('saves and loads learning data with Map conversion', async () => {
    const testData = {
      map: new Map([['key', 'value']])
    };

    await service.saveLearningData(testData);
    const loaded = await service.loadLearningData();

    expect(loaded.map).toBeInstanceOf(Map);
    expect(loaded.map.get('key')).toBe('value');
  });

  test('handles errors gracefully', async () => {
    mockFs.writeFile.mockRejectedValue(new Error('Test error'));
    await expect(service.saveLearningData({})).resolves.not.toThrow();
  });
}); 