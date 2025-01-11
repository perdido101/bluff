import { AdaptiveLearningService } from '../adaptiveLearningService';
import { PersistenceService } from '../persistenceService';
import { createMockGameState, createMockAction } from './setup';

jest.mock('../persistenceService');

describe('AdaptiveLearningService', () => {
  let service: AdaptiveLearningService;
  let mockPersistence: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistence = new PersistenceService() as jest.Mocked<PersistenceService>;
    service = new AdaptiveLearningService(mockPersistence);
  });

  test('learns from successful bluffs', async () => {
    const gameState = createMockGameState();
    const action = createMockAction('PLAY_CARDS', {
      cards: [],
      declaredValue: 'A'
    });

    await service.learn(action, true, gameState);
    const strategy = service.getOptimalStrategy(gameState);
    expect(strategy.recommendedBluffing).toBeTruthy();
  });

  test('learns from successful challenges', async () => {
    const gameState = createMockGameState();
    const action = createMockAction('CHALLENGE');

    await service.learn(action, true, gameState);
    const strategy = service.getOptimalStrategy(gameState);
    expect(strategy.recommendedChallenging).toBeTruthy();
  });

  test('identifies game stages correctly', () => {
    const earlyGame = createMockGameState({ playerHand: Array(25).fill(null), aiHand: 25 });
    const midGame = createMockGameState({ playerHand: Array(15).fill(null), aiHand: 15 });
    const lateGame = createMockGameState({ playerHand: Array(5).fill(null), aiHand: 5 });

    const strategy1 = service.getOptimalStrategy(earlyGame);
    const strategy2 = service.getOptimalStrategy(midGame);
    const strategy3 = service.getOptimalStrategy(lateGame);

    expect(strategy1).not.toEqual(strategy2);
    expect(strategy2).not.toEqual(strategy3);
  });
}); 