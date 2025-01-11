import { AdaptiveDifficultyService } from '../adaptiveDifficultyService';
import { PersistenceService } from '../persistenceService';
import { GameState, GameAction } from '../../types';

describe('AdaptiveDifficultyService', () => {
  let service: AdaptiveDifficultyService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  const createMockGameState = (
    aiCards = 5,
    playerCards = 5
  ): GameState => ({
    aiHand: aiCards,
    playerHand: Array(playerCards).fill({ suit: 'hearts', value: '2' }),
    centerPile: [],
    lastPlay: null,
    currentTurn: 'ai'
  });

  beforeEach(() => {
    mockPersistenceService = {
      loadPlayerMetrics: jest.fn().mockResolvedValue(null),
      savePlayerMetrics: jest.fn().mockResolvedValue(undefined)
    } as any;

    service = new AdaptiveDifficultyService(mockPersistenceService);
  });

  describe('Difficulty Adaptation', () => {
    it('should increase difficulty when player is winning', async () => {
      const initialDifficulty = service.getCurrentDifficulty();
      
      // Simulate player winning multiple games
      for (let i = 0; i < 5; i++) {
        await service.updateMetrics({
          winner: 'player',
          playerMoves: [],
          aiMoves: [],
          finalState: createMockGameState()
        });
      }

      const newDifficulty = service.getCurrentDifficulty();
      expect(newDifficulty.aggressiveness).toBeGreaterThan(initialDifficulty.aggressiveness);
      expect(newDifficulty.bluffFrequency).toBeGreaterThan(initialDifficulty.bluffFrequency);
      expect(newDifficulty.challengeThreshold).toBeLessThan(initialDifficulty.challengeThreshold);
    });

    it('should adapt to player bluffing weakness', async () => {
      const initialDifficulty = service.getCurrentDifficulty();
      
      // Simulate player failing at bluffing
      await service.updateMetrics({
        winner: 'ai',
        playerMoves: [
          {
            type: 'PLAY_CARDS',
            payload: {
              cards: [{ suit: 'hearts', value: '2' }],
              declaredValue: 'A'
            },
            wasChallenged: true
          }
        ],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const newDifficulty = service.getCurrentDifficulty();
      expect(newDifficulty.challengeThreshold).toBeLessThan(initialDifficulty.challengeThreshold);
    });

    it('should adapt to player challenge weakness', async () => {
      const initialDifficulty = service.getCurrentDifficulty();
      
      // Simulate player failing at challenges
      await service.updateMetrics({
        winner: 'ai',
        playerMoves: [
          {
            type: 'CHALLENGE',
            wasSuccessful: false
          }
        ],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const newDifficulty = service.getCurrentDifficulty();
      expect(newDifficulty.bluffFrequency).toBeGreaterThan(initialDifficulty.bluffFrequency);
    });
  });

  describe('Game State Modifiers', () => {
    it('should increase risk taking in critical positions', () => {
      const gameState = createMockGameState(2, 5);
      const modifiers = service.getDifficultyModifiers(gameState);

      expect(modifiers.bluffProbabilityMultiplier).toBeGreaterThan(0.7);
      expect(modifiers.riskToleranceMultiplier).toBeGreaterThan(0.7);
    });

    it('should play conservatively when winning in endgame', () => {
      const gameState = createMockGameState(3, 5);
      const modifiers = service.getDifficultyModifiers(gameState);

      expect(modifiers.bluffProbabilityMultiplier).toBeLessThan(1);
      expect(modifiers.challengeThresholdMultiplier).toBeGreaterThan(0.5);
    });

    it('should take more risks when losing in endgame', () => {
      const gameState = createMockGameState(5, 3);
      const modifiers = service.getDifficultyModifiers(gameState);

      expect(modifiers.bluffProbabilityMultiplier).toBeGreaterThan(0.6);
      expect(modifiers.riskToleranceMultiplier).toBeGreaterThan(0.7);
    });
  });

  describe('Metrics Tracking', () => {
    it('should track win rate correctly', async () => {
      await service.updateMetrics({
        winner: 'player',
        playerMoves: [],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const metrics = service.getPlayerMetrics();
      expect(metrics.winRate).toBe(1);
      expect(metrics.gamesPlayed).toBe(1);
    });

    it('should calculate average cards per play', async () => {
      await service.updateMetrics({
        winner: 'player',
        playerMoves: [
          {
            type: 'PLAY_CARDS',
            payload: {
              cards: [
                { suit: 'hearts', value: '2' },
                { suit: 'diamonds', value: '2' }
              ],
              declaredValue: '2'
            }
          }
        ],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const metrics = service.getPlayerMetrics();
      expect(metrics.averageCardsPerPlay).toBe(2);
    });

    it('should track bluff success rate', async () => {
      await service.updateMetrics({
        winner: 'player',
        playerMoves: [
          {
            type: 'PLAY_CARDS',
            payload: {
              cards: [{ suit: 'hearts', value: '2' }],
              declaredValue: 'A'
            },
            wasChallenged: false
          }
        ],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const metrics = service.getPlayerMetrics();
      expect(metrics.bluffSuccessRate).toBe(1);
    });

    it('should track challenge success rate', async () => {
      await service.updateMetrics({
        winner: 'player',
        playerMoves: [
          {
            type: 'CHALLENGE',
            wasSuccessful: true
          }
        ],
        aiMoves: [],
        finalState: createMockGameState()
      });

      const metrics = service.getPlayerMetrics();
      expect(metrics.challengeSuccessRate).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should load metrics from persistence service', async () => {
      const savedMetrics = {
        winRate: 0.7,
        averageCardsPerPlay: 2,
        bluffSuccessRate: 0.6,
        challengeSuccessRate: 0.5,
        averageTimeToWin: 300,
        gamesPlayed: 10
      };

      mockPersistenceService.loadPlayerMetrics.mockResolvedValueOnce(savedMetrics);
      
      service = new AdaptiveDifficultyService(mockPersistenceService);
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async load

      const metrics = service.getPlayerMetrics();
      expect(metrics).toEqual(savedMetrics);
    });

    it('should save metrics after updates', async () => {
      await service.updateMetrics({
        winner: 'player',
        playerMoves: [],
        aiMoves: [],
        finalState: createMockGameState()
      });

      expect(mockPersistenceService.savePlayerMetrics).toHaveBeenCalled();
    });
  });
}); 