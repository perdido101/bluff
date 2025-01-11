import { PatternRecognitionService } from '../patternRecognitionService';
import { PersistenceService } from '../persistenceService';
import { createMockGameState, createMockAction, createMockCard } from './setup';

jest.mock('../persistenceService');

describe('PatternRecognitionService', () => {
  let service: PatternRecognitionService;
  let mockPersistence: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistence = new PersistenceService() as jest.Mocked<PersistenceService>;
    service = new PatternRecognitionService(mockPersistence);
  });

  test('analyzes bluffing patterns', async () => {
    const gameState = createMockGameState();
    const action = createMockAction('PLAY_CARDS', {
      cards: [createMockCard('2', 'hearts')],
      declaredValue: 'A'
    });

    await service.analyzePatterns(action, gameState);
    const prediction = service.getPrediction();
    expect(prediction.likelyToBluff).toBeGreaterThan(0);
  });

  test('tracks consecutive plays', async () => {
    const gameState = createMockGameState();
    const action = createMockAction('PLAY_CARDS', {
      cards: [createMockCard('A', 'hearts')],
      declaredValue: 'A'
    });

    await service.analyzePatterns(action, gameState);
    await service.analyzePatterns(action, gameState);
    await service.analyzePatterns(action, gameState);

    const prediction = service.getPrediction();
    expect(prediction.likelyToChallenge).toBeGreaterThan(0);
  });
}); 