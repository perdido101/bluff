import { MLIntegrationService } from '../mlIntegrationService';
import { AIStrategyService } from '../aiStrategyService';
import { PatternRecognitionService } from '../patternRecognitionService';
import { AdaptiveLearningService } from '../adaptiveLearningService';
import { AIPersonalityService } from '../aiPersonalityService';
import { ModelMonitoringService } from '../modelMonitoringService';
import { PerformanceMetricsService } from '../performanceMetricsService';
import { PersistenceService } from '../persistenceService';
import { GameState, GameAction, Card } from '../../types';

describe('Game Integration Tests', () => {
  // Initialize all services with real implementations
  let persistenceService: PersistenceService;
  let aiStrategy: AIStrategyService;
  let aiPersonality: AIPersonalityService;
  let patternRecognition: PatternRecognitionService;
  let adaptiveLearning: AdaptiveLearningService;
  let modelMonitoring: ModelMonitoringService;
  let performanceMetrics: PerformanceMetricsService;
  let mlIntegration: MLIntegrationService;

  const createGameState = (
    playerCards: Card[],
    aiCards: Card[],
    centerPile: Card[] = [],
    lastPlay?: GameState['lastPlay']
  ): GameState => ({
    playerHand: playerCards,
    aiHand: aiCards.length,
    aiCards,
    centerPile,
    currentTurn: 'ai',
    lastPlay
  });

  beforeEach(async () => {
    persistenceService = new PersistenceService();
    await persistenceService.init();

    aiStrategy = new AIStrategyService();
    aiPersonality = new AIPersonalityService();
    patternRecognition = new PatternRecognitionService(persistenceService);
    adaptiveLearning = new AdaptiveLearningService(persistenceService);
    modelMonitoring = new ModelMonitoringService(persistenceService);
    performanceMetrics = new PerformanceMetricsService(persistenceService);

    mlIntegration = new MLIntegrationService(
      aiStrategy,
      patternRecognition,
      adaptiveLearning,
      aiPersonality,
      modelMonitoring
    );
  });

  describe('Complete Game Scenarios', () => {
    test('AI plays optimal moves in early game', async () => {
      // Setup early game state with good cards
      const gameState = createGameState(
        [{ suit: 'hearts', value: '2' }, { suit: 'diamonds', value: '3' }],
        [{ suit: 'spades', value: 'K' }, { suit: 'clubs', value: 'K' }]
      );

      const decision = await mlIntegration.makeDecision(gameState);
      
      // AI should play its pair of kings
      expect(decision.type).toBe('PLAY_CARDS');
      expect(decision.payload?.cards).toHaveLength(2);
      expect(decision.payload?.cards.every(card => card.value === 'K')).toBe(true);
      expect(decision.payload?.declaredValue).toBe('K');
    });

    test('AI detects and challenges obvious bluffs', async () => {
      // Setup game state where player just made a suspicious play
      const gameState = createGameState(
        [{ suit: 'hearts', value: '2' }],
        [{ suit: 'diamonds', value: '4' }],
        [],
        {
          player: 'player',
          declaredCards: 'A',
          actualCards: [{ suit: 'clubs', value: '2' }]
        }
      );

      // Train the AI to recognize this pattern
      await mlIntegration.updateModel(
        {
          type: 'PLAY_CARDS',
          payload: {
            cards: [{ suit: 'hearts', value: '2' }],
            declaredValue: 'A'
          }
        },
        false,
        gameState
      );

      const decision = await mlIntegration.makeDecision(gameState);
      expect(decision.type).toBe('CHALLENGE');
    });

    test('AI adapts bluffing strategy based on player behavior', async () => {
      const gameState = createGameState(
        [{ suit: 'hearts', value: 'Q' }],
        [{ suit: 'diamonds', value: '2' }]
      );

      // First, simulate player frequently challenging
      for (let i = 0; i < 3; i++) {
        await mlIntegration.updateModel(
          { type: 'CHALLENGE' },
          true,
          gameState
        );
      }

      const decision1 = await mlIntegration.makeDecision(gameState);
      const isBluffing1 = decision1.type === 'PLAY_CARDS' && 
        decision1.payload?.cards[0].value !== decision1.payload?.declaredValue;
      
      // Now simulate player rarely challenging
      for (let i = 0; i < 3; i++) {
        await mlIntegration.updateModel(
          { type: 'PASS' },
          true,
          gameState
        );
      }

      const decision2 = await mlIntegration.makeDecision(gameState);
      const isBluffing2 = decision2.type === 'PLAY_CARDS' && 
        decision2.payload?.cards[0].value !== decision2.payload?.declaredValue;

      // AI should bluff more when player rarely challenges
      expect(isBluffing2).toBe(true);
      expect(isBluffing1).toBe(false);
    });
  });

  describe('Strategic Decision Making', () => {
    test('AI makes strategic endgame decisions', async () => {
      // Setup endgame state where AI has one card left
      const gameState = createGameState(
        [{ suit: 'hearts', value: 'A' }, { suit: 'diamonds', value: 'K' }],
        [{ suit: 'clubs', value: '2' }],
        [],
        {
          player: 'player',
          declaredCards: 'K',
          actualCards: [{ suit: 'spades', value: 'K' }]
        }
      );

      const decision = await mlIntegration.makeDecision(gameState);
      
      // AI should be more likely to bluff to win
      expect(decision.type).toBe('PLAY_CARDS');
      if (decision.payload) {
        expect(decision.payload.declaredValue >= 'K').toBe(true);
      }
    });

    test('AI learns from successful player strategies', async () => {
      const gameState = createGameState(
        [{ suit: 'hearts', value: '2' }],
        [{ suit: 'diamonds', value: '3' }]
      );

      // Simulate successful player strategy of bluffing with low cards
      for (let i = 0; i < 3; i++) {
        await mlIntegration.updateModel(
          {
            type: 'PLAY_CARDS',
            payload: {
              cards: [{ suit: 'hearts', value: '2' }],
              declaredValue: 'A'
            }
          },
          true,
          gameState
        );
      }

      const decision = await mlIntegration.makeDecision(gameState);
      expect(decision.type).toBe('PLAY_CARDS');
      if (decision.payload) {
        expect(decision.payload.declaredValue > decision.payload.cards[0].value).toBe(true);
      }
    });
  });

  describe('Performance Metrics Integration', () => {
    test('tracks and uses performance metrics for decision making', async () => {
      const gameId = performanceMetrics.startNewGame(createGameState([], []));

      // Simulate a series of successful bluffs
      const gameState = createGameState(
        [{ suit: 'hearts', value: '2' }],
        [{ suit: 'diamonds', value: '3' }]
      );

      for (let i = 0; i < 3; i++) {
        await performanceMetrics.recordMove(
          'ai',
          {
            type: 'PLAY_CARDS',
            payload: {
              cards: [{ suit: 'diamonds', value: '3' }],
              declaredValue: 'A'
            }
          },
          true,
          gameState
        );
      }

      const decision = await mlIntegration.makeDecision(gameState);
      expect(decision.type).toBe('PLAY_CARDS');
      
      // AI should be more confident in bluffing due to past success
      if (decision.payload) {
        const isBluffing = decision.payload.declaredValue !== decision.payload.cards[0].value;
        expect(isBluffing).toBe(true);
      }

      await performanceMetrics.endGame('ai');
    });
  });
}); 