import { ReinforcementLearningService } from '../reinforcementLearningService';
import { PersistenceService } from '../persistenceService';
import { GameState, GameAction } from '../../types';

describe('ReinforcementLearningService', () => {
  let service: ReinforcementLearningService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  const createMockGameState = (
    aiCards = 5,
    playerCards = 5,
    centerPile = 0,
    lastPlay?: GameAction
  ): GameState => ({
    aiHand: aiCards,
    playerHand: Array(playerCards).fill({ suit: 'hearts', value: '2' }),
    centerPile: Array(centerPile).fill({ suit: 'hearts', value: '2' }),
    lastPlay: lastPlay ? {
      player: 'player',
      declaredCards: lastPlay.payload?.declaredValue || '',
      actualCards: lastPlay.payload?.cards || []
    } : null,
    currentTurn: 'ai'
  });

  beforeEach(() => {
    mockPersistenceService = {
      loadQTable: jest.fn().mockResolvedValue(null),
      saveQTable: jest.fn().mockResolvedValue(undefined)
    } as any;

    service = new ReinforcementLearningService(mockPersistenceService);
  });

  describe('Action Selection', () => {
    it('should suggest valid actions for given game state', () => {
      const gameState = createMockGameState();
      const action = service.suggestAction(gameState);
      
      expect(action.type).toMatch(/^(PASS|PLAY_CARDS|CHALLENGE)$/);
      if (action.type === 'PLAY_CARDS') {
        expect(action.cardCount).toBeLessThanOrEqual(gameState.aiHand);
        expect(action.declaredValue).toBeDefined();
      }
    });

    it('should include CHALLENGE action when player made last move', () => {
      const lastPlay: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: '2' }],
          declaredValue: 'A'
        }
      };
      const gameState = createMockGameState(5, 5, 0, lastPlay);
      
      // Call multiple times to account for exploration randomness
      const actions = new Set();
      for (let i = 0; i < 50; i++) {
        const action = service.suggestAction(gameState);
        actions.add(action.type);
      }
      
      expect(actions.has('CHALLENGE')).toBe(true);
    });

    it('should respect game rules when suggesting card plays', () => {
      const lastPlay: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: 'K' }],
          declaredValue: 'K'
        }
      };
      const gameState = createMockGameState(5, 5, 0, lastPlay);
      
      const action = service.suggestAction(gameState);
      if (action.type === 'PLAY_CARDS' && action.declaredValue) {
        expect(['A', 'PASS']).toContain(action.declaredValue);
      }
    });
  });

  describe('Learning and Updates', () => {
    it('should update Q-values based on rewards', () => {
      const gameState = createMockGameState();
      const action: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: 'A' }],
          declaredValue: 'A'
        }
      };
      const nextState = createMockGameState(4, 5, 1);

      // First action to establish baseline
      service.suggestAction(gameState);
      service.updateFromGameResult(gameState, action, 1, nextState);

      // Get stats after update
      const stats = service.getActionStats({
        gameState: {
          aiCards: gameState.aiHand,
          playerCards: gameState.playerHand.length,
          centerPile: gameState.centerPile.length
        },
        action: {
          type: action.type,
          cardCount: action.payload?.cards.length,
          declaredValue: action.payload?.declaredValue
        }
      });

      expect(stats.qValue).toBeGreaterThan(0);
      expect(stats.visits).toBe(1);
      expect(stats.averageReward).toBe(1);
    });

    it('should maintain exploration rate during learning', () => {
      const explorationRate = service.getExplorationRate();
      const gameState = createMockGameState();
      
      // Track exploration vs exploitation
      let explorationCount = 0;
      const totalTrials = 1000;
      
      for (let i = 0; i < totalTrials; i++) {
        const action = service.suggestAction(gameState);
        if (action.type === 'PASS') {
          // PASS is unlikely to be the best action in initial state
          explorationCount++;
        }
      }

      // Allow for some statistical variance
      const observedRate = explorationCount / totalTrials;
      expect(Math.abs(observedRate - explorationRate)).toBeLessThan(0.1);
    });

    it('should track learning progress', () => {
      const gameState = createMockGameState();
      const action: GameAction = {
        type: 'CHALLENGE'
      };
      const nextState = createMockGameState(5, 4, 0);

      // Perform multiple updates
      for (let i = 0; i < 5; i++) {
        service.suggestAction(gameState);
        service.updateFromGameResult(gameState, action, i % 2 ? 1 : -1, nextState);
      }

      const progress = service.getLearningProgress();
      expect(progress.totalStates).toBeGreaterThan(0);
      expect(progress.averageQValue).toBeDefined();
      expect(progress.mostVisitedStates.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should persist Q-table between sessions', async () => {
      const gameState = createMockGameState();
      const action: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: 'A' }],
          declaredValue: 'A'
        }
      };
      const nextState = createMockGameState(4, 5, 1);

      // Perform some learning
      service.suggestAction(gameState);
      service.updateFromGameResult(gameState, action, 1, nextState);

      // Verify save was called
      expect(mockPersistenceService.saveQTable).toHaveBeenCalled();
    });

    it('should handle invalid state transitions gracefully', () => {
      const invalidState = null as any;
      const action: GameAction = { type: 'PASS' };
      const nextState = createMockGameState();

      // Should not throw
      expect(() => {
        service.updateFromGameResult(invalidState, action, 0, nextState);
      }).not.toThrow();
    });
  });
}); 