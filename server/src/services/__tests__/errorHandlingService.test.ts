import { ErrorHandlingService } from '../errorHandlingService';
import { GameState, GameAction } from '../../types';

describe('ErrorHandlingService', () => {
  let errorHandler: ErrorHandlingService;

  beforeEach(() => {
    errorHandler = new ErrorHandlingService();
  });

  describe('validateGameState', () => {
    it('should accept valid game state', () => {
      const validState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: [],
        lastPlay: {
          player: 'player',
          declaredCards: '7',
          actualCards: []
        }
      };

      expect(() => errorHandler.validateGameState(validState)).not.toThrow();
    });

    it('should throw on null game state', () => {
      expect(() => errorHandler.validateGameState(null as any)).toThrow('Invalid game state: Game state is null or undefined');
    });

    it('should throw on invalid aiHand type', () => {
      const invalidState: GameState = {
        aiHand: '5' as any,
        playerHand: [],
        centerPile: []
      };

      expect(() => errorHandler.validateGameState(invalidState)).toThrow('Invalid game state: AI hand is not a number');
    });

    it('should throw on invalid lastPlay player type', () => {
      const invalidState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: [],
        lastPlay: {
          player: 123 as any,
          declaredCards: '7',
          actualCards: []
        }
      };

      expect(() => errorHandler.validateGameState(invalidState)).toThrow('Invalid game state: Last play player is not a string');
    });
  });

  describe('validateAction', () => {
    it('should accept valid pass action', () => {
      const validAction: GameAction = { type: 'PASS' };
      expect(() => errorHandler.validateAction(validAction)).not.toThrow();
    });

    it('should accept valid challenge action', () => {
      const validAction: GameAction = { type: 'CHALLENGE' };
      expect(() => errorHandler.validateAction(validAction)).not.toThrow();
    });

    it('should accept valid play cards action', () => {
      const validAction: GameAction = {
        type: 'PLAY_CARDS',
        cards: [{ suit: 'hearts', value: '7' }]
      };
      expect(() => errorHandler.validateAction(validAction)).not.toThrow();
    });

    it('should throw on null action', () => {
      expect(() => errorHandler.validateAction(null as any)).toThrow('Invalid action: Action is null or undefined');
    });

    it('should throw on missing action type', () => {
      const invalidAction = {} as GameAction;
      expect(() => errorHandler.validateAction(invalidAction)).toThrow('Invalid action: Action type is missing');
    });

    it('should throw on invalid action type', () => {
      const invalidAction = { type: 'INVALID' } as any;
      expect(() => errorHandler.validateAction(invalidAction)).toThrow('Invalid action: Unknown action type INVALID');
    });

    it('should throw on play cards action without cards array', () => {
      const invalidAction = { type: 'PLAY_CARDS' } as GameAction;
      expect(() => errorHandler.validateAction(invalidAction)).toThrow('Invalid action: Play cards action missing cards array');
    });
  });

  describe('handleCacheError', () => {
    it('should log non-critical cache errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Cache miss');
      
      errorHandler.handleCacheError(error, 'getCachedDecision');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning - Cache operation failed: getCachedDecision:',
        error
      );
      consoleSpy.mockRestore();
    });

    it('should update error stats for cache errors', () => {
      const error = new Error('Cache miss');
      errorHandler.handleCacheError(error, 'getCachedDecision');
      
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType['Error']).toBe(1);
      expect(stats.lastError?.message).toContain('Cache operation failed: getCachedDecision');
    });
  });

  describe('handleDecisionError', () => {
    it('should return PASS action on error', () => {
      const error = new Error('Decision failed');
      const gameState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: []
      };

      const result = errorHandler.handleDecisionError(error, gameState);
      expect(result).toEqual({ type: 'PASS' });
    });

    it('should log critical decision errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Decision failed');
      const gameState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: []
      };

      errorHandler.handleDecisionError(error, gameState);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Critical Error - Decision making failed:',
        error
      );
      consoleSpy.mockRestore();
    });
  });

  describe('handlePredictionError', () => {
    it('should return default predictions on error', () => {
      const error = new Error('Prediction failed');
      const gameState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: []
      };

      const result = errorHandler.handlePredictionError(error, gameState);
      
      expect(result).toMatchObject({
        patterns: {
          likelyToBluff: 0.5,
          likelyToChallenge: 0.5
        },
        playerStats: {
          bluffFrequency: 0.5,
          challengeFrequency: 0.5
        }
      });
    });

    it('should log critical prediction errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Prediction failed');
      const gameState: GameState = {
        aiHand: 5,
        playerHand: [],
        centerPile: []
      };

      errorHandler.handlePredictionError(error, gameState);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Critical Error - ML prediction failed:',
        error
      );
      consoleSpy.mockRestore();
    });
  });

  describe('error stats tracking', () => {
    it('should track multiple error types', () => {
      const error1 = new TypeError('Type error');
      const error2 = new Error('Generic error');
      
      errorHandler.logError(error1, true, 'Test context');
      errorHandler.logError(error2, false, 'Test context');
      
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType['TypeError']).toBe(1);
      expect(stats.errorsByType['Error']).toBe(1);
    });

    it('should maintain last error information', () => {
      const error = new Error('Test error');
      const context = 'Test context';
      
      errorHandler.logError(error, true, context);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.lastError?.message).toBe(`${context}: ${error.message}`);
      expect(stats.lastError?.timestamp).toBeInstanceOf(Date);
    });
  });
}); 