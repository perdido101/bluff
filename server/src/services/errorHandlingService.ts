import { GameState, GameAction } from '../types';

interface ErrorStats {
  totalErrors: number;
  errorsByType: { [key: string]: number };
  lastError: {
    message: string;
    timestamp: Date;
  } | null;
}

export class ErrorHandlingService {
  private errorStats: ErrorStats = {
    totalErrors: 0,
    errorsByType: {},
    lastError: null
  };

  validateGameState(gameState: GameState): void {
    if (!gameState) {
      throw new Error('Invalid game state: Game state is null or undefined');
    }

    if (typeof gameState.aiHand !== 'number') {
      throw new Error('Invalid game state: AI hand is not a number');
    }

    if (gameState.lastPlay && typeof gameState.lastPlay.player !== 'string') {
      throw new Error('Invalid game state: Last play player is not a string');
    }
  }

  validateAction(action: GameAction): void {
    if (!action) {
      throw new Error('Invalid action: Action is null or undefined');
    }

    if (!action.type) {
      throw new Error('Invalid action: Action type is missing');
    }

    if (!['PASS', 'CHALLENGE', 'PLAY_CARDS'].includes(action.type)) {
      throw new Error(`Invalid action: Unknown action type ${action.type}`);
    }

    if (action.type === 'PLAY_CARDS' && (!action.cards || !Array.isArray(action.cards))) {
      throw new Error('Invalid action: Play cards action missing cards array');
    }
  }

  handleCacheError(error: Error, operation: string): void {
    this.logError(error, false, `Cache operation failed: ${operation}`);
    // Continue execution - cache errors are non-fatal
  }

  handleDecisionError(error: Error, gameState: GameState): GameAction {
    this.logError(error, true, 'Decision making failed');
    
    // Fallback to safe default action
    return {
      type: 'PASS'
    };
  }

  handlePredictionError(error: Error, gameState: GameState): any {
    this.logError(error, true, 'ML prediction failed');
    
    // Return fallback predictions
    return {
      patterns: {
        likelyToBluff: 0.5,
        likelyToChallenge: 0.5
      },
      playerStats: {
        bluffFrequency: 0.5,
        challengeFrequency: 0.5
      },
      optimalStrategy: {
        recommendedAction: 'PASS',
        confidence: 0.5
      },
      personalityTraits: {
        riskTolerance: 0.5,
        aggressiveness: 0.5
      }
    };
  }

  logError(error: Error, isCritical: boolean, context: string): void {
    // Update error stats
    this.errorStats.totalErrors++;
    const errorType = error.constructor.name;
    this.errorStats.errorsByType[errorType] = (this.errorStats.errorsByType[errorType] || 0) + 1;
    this.errorStats.lastError = {
      message: `${context}: ${error.message}`,
      timestamp: new Date()
    };

    // Log the error
    if (isCritical) {
      console.error(`Critical Error - ${context}:`, error);
    } else {
      console.warn(`Warning - ${context}:`, error);
    }
  }

  getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }
} 