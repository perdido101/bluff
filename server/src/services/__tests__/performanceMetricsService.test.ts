import { PerformanceMetricsService } from '../performanceMetricsService';
import { PersistenceService } from '../persistenceService';
import { GameState, GameAction } from '../../types';

jest.mock('../persistenceService');

describe('PerformanceMetricsService', () => {
  let service: PerformanceMetricsService;
  let mockPersistence: jest.Mocked<PersistenceService>;

  const mockGameState: GameState = {
    playerHand: Array(13).fill({ suit: 'hearts', value: 'A' }),
    aiHand: 13,
    centerPile: [],
    currentTurn: 'player',
    lastPlay: undefined
  };

  const createMockAction = (type: string, payload?: any): GameAction => ({
    type: type as any,
    payload
  });

  beforeEach(() => {
    mockPersistence = new PersistenceService() as jest.Mocked<PersistenceService>;
    service = new PerformanceMetricsService(mockPersistence);
  });

  describe('Game Lifecycle', () => {
    test('starts new game with correct initial stats', () => {
      const gameId = service.startNewGame(mockGameState);
      const stats = service.getCurrentGameStats();

      expect(gameId).toBeTruthy();
      expect(stats).toMatchObject({
        totalMoves: 0,
        aiStats: {
          initialCards: 13,
          cardsPlayed: 0,
          successfulBluffs: 0,
          failedBluffs: 0
        },
        playerStats: {
          initialCards: 13,
          cardsPlayed: 0,
          successfulBluffs: 0,
          failedBluffs: 0
        }
      });
    });

    test('records moves correctly', async () => {
      service.startNewGame(mockGameState);

      // Test player move
      await service.recordMove('player', createMockAction('PLAY_CARDS', {
        cards: [{ suit: 'hearts', value: '2' }],
        declaredValue: 'A'
      }), true, mockGameState);

      let stats = service.getCurrentGameStats();
      expect(stats?.playerStats.cardsPlayed).toBe(1);
      expect(stats?.playerStats.successfulBluffs).toBe(1);

      // Test AI move
      await service.recordMove('ai', createMockAction('CHALLENGE'), false, mockGameState);
      
      stats = service.getCurrentGameStats();
      expect(stats?.aiStats.failedChallenges).toBe(1);
    });

    test('ends game and updates aggregate metrics', async () => {
      service.startNewGame(mockGameState);
      await service.recordMove('player', createMockAction('PLAY_CARDS', {
        cards: [{ suit: 'hearts', value: '2' }],
        declaredValue: 'A'
      }), true, mockGameState);
      await service.endGame('player');

      const metrics = service.getAggregateMetrics();
      expect(metrics.totalGames).toBe(1);
      expect(metrics.aiWinRate).toBe(0);
      expect(metrics.averageMovesPerGame).toBe(1);
    });
  });

  describe('Performance Tracking', () => {
    test('calculates bluff success rates correctly', async () => {
      service.startNewGame(mockGameState);

      // Successful bluff
      await service.recordMove('player', createMockAction('PLAY_CARDS', {
        cards: [{ suit: 'hearts', value: '2' }],
        declaredValue: 'A'
      }), true, mockGameState);

      // Failed bluff
      await service.recordMove('player', createMockAction('PLAY_CARDS', {
        cards: [{ suit: 'hearts', value: '3' }],
        declaredValue: 'K'
      }), false, mockGameState);

      await service.endGame('player');

      const metrics = service.getAggregateMetrics();
      expect(metrics.playerPerformance.bluffSuccessRate).toBe(0.5);
    });

    test('tracks challenge performance correctly', async () => {
      service.startNewGame(mockGameState);

      // Successful challenge
      await service.recordMove('ai', createMockAction('CHALLENGE'), true, mockGameState);
      // Failed challenge
      await service.recordMove('ai', createMockAction('CHALLENGE'), false, mockGameState);

      await service.endGame('ai');

      const metrics = service.getAggregateMetrics();
      expect(metrics.aiPerformance.challengeSuccessRate).toBe(0.5);
    });

    test('maintains game history correctly', async () => {
      // First game
      service.startNewGame(mockGameState);
      await service.recordMove('player', createMockAction('PASS'), true, mockGameState);
      await service.endGame('player');

      // Second game
      service.startNewGame(mockGameState);
      await service.recordMove('ai', createMockAction('PASS'), true, mockGameState);
      await service.endGame('ai');

      const history = service.getGameHistory();
      expect(history).toHaveLength(2);
      expect(history[0].winner).toBe('player');
      expect(history[1].winner).toBe('ai');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty game history gracefully', () => {
      const metrics = service.getAggregateMetrics();
      expect(metrics.totalGames).toBe(0);
      expect(metrics.aiWinRate).toBe(0);
      expect(metrics.averageGameDuration).toBe(0);
    });

    test('handles concurrent games correctly', async () => {
      const gameId1 = service.startNewGame(mockGameState);
      await service.recordMove('player', createMockAction('PASS'), true, mockGameState);
      
      // Try to start another game before ending the first
      const gameId2 = service.startNewGame(mockGameState);
      
      const currentStats = service.getCurrentGameStats();
      expect(currentStats?.gameId).toBe(gameId2);
      expect(currentStats?.totalMoves).toBe(0);
    });
  });
}); 