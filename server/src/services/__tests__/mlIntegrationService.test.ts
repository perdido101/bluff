import { MLIntegrationService } from '../mlIntegrationService';
import { AIStrategyService } from '../aiStrategyService';
import { PatternRecognitionService } from '../patternRecognitionService';
import { AdaptiveLearningService } from '../adaptiveLearningService';
import { AIPersonalityService } from '../aiPersonalityService';
import { ModelMonitoringService } from '../modelMonitoringService';
import { GameState, GameAction, Card } from '../../types';

// Mock dependencies
jest.mock('../aiStrategyService');
jest.mock('../patternRecognitionService');
jest.mock('../adaptiveLearningService');
jest.mock('../aiPersonalityService');
jest.mock('../modelMonitoringService');

describe('MLIntegrationService Error Handling', () => {
  let mlIntegration: MLIntegrationService;
  let aiStrategy: jest.Mocked<AIStrategyService>;
  let patternRecognition: jest.Mocked<PatternRecognitionService>;
  let adaptiveLearning: jest.Mocked<AdaptiveLearningService>;
  let aiPersonality: jest.Mocked<AIPersonalityService>;
  let modelMonitoring: jest.Mocked<ModelMonitoringService>;

  const validGameState: GameState = {
    aiHand: 3,
    playerHand: [],
    centerPile: [],
    lastPlay: {
      player: 'player',
      declaredCards: '7',
      actualCards: []
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocked services
    aiStrategy = new AIStrategyService() as jest.Mocked<AIStrategyService>;
    patternRecognition = new PatternRecognitionService() as jest.Mocked<PatternRecognitionService>;
    adaptiveLearning = new AdaptiveLearningService() as jest.Mocked<AdaptiveLearningService>;
    aiPersonality = new AIPersonalityService() as jest.Mocked<AIPersonalityService>;
    modelMonitoring = new ModelMonitoringService() as jest.Mocked<ModelMonitoringService>;

    // Set up default mock implementations
    aiStrategy.getPlayerAnalysis.mockReturnValue({
      bluffFrequency: 0.3,
      challengeFrequency: 0.3
    });

    patternRecognition.getPrediction.mockReturnValue({
      likelyToBluff: 0.4,
      likelyToChallenge: 0.4
    });

    adaptiveLearning.getOptimalStrategy.mockReturnValue({
      recommendedAction: 'PASS',
      confidence: 0.8
    });

    aiPersonality.getPersonalityTraits.mockReturnValue({
      riskTolerance: 0.5,
      aggressiveness: 0.5
    });

    modelMonitoring.recordDecision.mockResolvedValue(undefined);

    // Initialize service under test
    mlIntegration = new MLIntegrationService(
      aiStrategy,
      patternRecognition,
      adaptiveLearning,
      aiPersonality,
      modelMonitoring
    );
  });

  describe('makeDecision error handling', () => {
    it('should handle invalid game state gracefully', async () => {
      const invalidState = null as any;
      const result = await mlIntegration.makeDecision(invalidState);
      
      expect(result).toEqual({ type: 'PASS' });
      expect(aiStrategy.getPlayerAnalysis).not.toHaveBeenCalled();
    });

    it('should handle prediction service failure', async () => {
      patternRecognition.getPrediction.mockImplementation(() => {
        throw new Error('Prediction failed');
      });

      const result = await mlIntegration.makeDecision(validGameState);
      
      expect(result).toEqual({ type: 'PASS' });
      const stats = mlIntegration.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    it('should handle strategy service failure', async () => {
      aiStrategy.getPlayerAnalysis.mockImplementation(() => {
        throw new Error('Strategy analysis failed');
      });

      const result = await mlIntegration.makeDecision(validGameState);
      
      expect(result).toEqual({ type: 'PASS' });
      const stats = mlIntegration.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    it('should handle monitoring service failure without breaking decision making', async () => {
      modelMonitoring.recordDecision.mockRejectedValue(new Error('Monitoring failed'));

      const result = await mlIntegration.makeDecision(validGameState);
      
      // Should still make a decision despite monitoring failure
      expect(result).toHaveProperty('type');
      const stats = mlIntegration.getErrorStats();
      expect(stats.errorsByType['Error']).toBeGreaterThan(0);
    });
  });

  describe('updateModel error handling', () => {
    const validAction: GameAction = { type: 'PASS' };

    it('should handle invalid action gracefully', async () => {
      const invalidAction = null as any;
      await mlIntegration.updateModel(invalidAction, true, validGameState);
      
      const stats = mlIntegration.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(patternRecognition.analyzePatterns).not.toHaveBeenCalled();
    });

    it('should continue if pattern recognition update fails', async () => {
      patternRecognition.analyzePatterns.mockRejectedValue(new Error('Pattern analysis failed'));

      await mlIntegration.updateModel(validAction, true, validGameState);
      
      // Should still try to update other services
      expect(adaptiveLearning.learn).toHaveBeenCalled();
      expect(aiStrategy.updatePlayerPatterns).toHaveBeenCalled();
    });

    it('should handle multiple service failures gracefully', async () => {
      patternRecognition.analyzePatterns.mockRejectedValue(new Error('Pattern analysis failed'));
      adaptiveLearning.learn.mockRejectedValue(new Error('Learning failed'));
      
      await mlIntegration.updateModel(validAction, true, validGameState);
      
      const stats = mlIntegration.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(1);
    });

    it('should handle monitoring service failure in update', async () => {
      modelMonitoring.recordOutcome.mockRejectedValue(new Error('Monitoring failed'));

      await mlIntegration.updateModel(validAction, true, validGameState);
      
      // Should still update other services despite monitoring failure
      expect(patternRecognition.analyzePatterns).toHaveBeenCalled();
      expect(adaptiveLearning.learn).toHaveBeenCalled();
    });
  });

  describe('cache handling', () => {
    it('should continue with fresh prediction on cache error', async () => {
      // Force a cache error by making cache methods throw
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await mlIntegration.makeDecision(validGameState);
      
      expect(result).toHaveProperty('type');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle cache invalidation errors gracefully', async () => {
      const validAction: GameAction = { type: 'PASS' };
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await mlIntegration.updateModel(validAction, true, validGameState);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('MLIntegrationService Card Selection', () => {
  let service: MLIntegrationService;
  
  const createMockGameState = (aiCards: Card[]): GameState => ({
    aiCards,
    playerHand: [],
    centerPile: [],
    lastPlay: null,
    currentTurn: 'ai',
    aiHand: aiCards.length
  });

  beforeEach(() => {
    service = new MLIntegrationService(
      {} as any, // aiStrategy
      {} as any, // patternRecognition
      {} as any, // adaptiveLearning
      {} as any, // aiPersonality
      {} as any, // modelMonitoring
      {} as any  // reinforcementLearning
    );
  });

  describe('selectCardsForPlay', () => {
    it('should select matching cards when available', async () => {
      const aiCards = [
        { suit: 'hearts', value: 'K' },
        { suit: 'diamonds', value: 'K' },
        { suit: 'spades', value: '2' }
      ];
      const gameState = createMockGameState(aiCards);

      const selected = await service['selectCardsForPlay'](gameState, 2, 'K');
      
      expect(selected).toHaveLength(2);
      expect(selected.every(card => card.value === 'K')).toBe(true);
    });

    it('should handle bluffing with optimal card selection', async () => {
      const aiCards = [
        { suit: 'hearts', value: '2' },
        { suit: 'diamonds', value: '3' },
        { suit: 'spades', value: '4' }
      ];
      const gameState = createMockGameState(aiCards);

      const selected = await service['selectCardsForPlay'](gameState, 2, 'K');
      
      expect(selected).toHaveLength(2);
      // Should prefer lower value cards for bluffing
      expect(selected.every(card => ['2', '3'].includes(card.value))).toBe(true);
    });

    it('should handle empty hand gracefully', async () => {
      const gameState = createMockGameState([]);
      const selected = await service['selectCardsForPlay'](gameState, 2, 'A');
      expect(selected).toHaveLength(0);
    });

    it('should handle requesting more cards than available', async () => {
      const aiCards = [
        { suit: 'hearts', value: 'K' },
        { suit: 'diamonds', value: 'K' }
      ];
      const gameState = createMockGameState(aiCards);

      const selected = await service['selectCardsForPlay'](gameState, 3, 'K');
      expect(selected).toHaveLength(2);
      expect(selected.every(card => card.value === 'K')).toBe(true);
    });

    it('should prefer cards from same value group when bluffing', async () => {
      const aiCards = [
        { suit: 'hearts', value: '2' },
        { suit: 'diamonds', value: '2' },
        { suit: 'spades', value: '3' },
        { suit: 'clubs', value: '4' }
      ];
      const gameState = createMockGameState(aiCards);

      const selected = await service['selectCardsForPlay'](gameState, 2, 'A');
      
      expect(selected).toHaveLength(2);
      expect(selected[0].value).toBe(selected[1].value);
      expect(selected[0].value).toBe('2');
    });

    it('should select cards further from declared value when bluffing', async () => {
      const aiCards = [
        { suit: 'hearts', value: '2' },
        { suit: 'diamonds', value: '9' },
        { suit: 'spades', value: 'Q' }
      ];
      const gameState = createMockGameState(aiCards);

      const selected = await service['selectCardsForPlay'](gameState, 1, 'K');
      
      expect(selected).toHaveLength(1);
      expect(selected[0].value).toBe('2');
    });
  });

  describe('groupCardsByValue', () => {
    it('should group cards correctly', () => {
      const cards = [
        { suit: 'hearts', value: 'K' },
        { suit: 'diamonds', value: 'K' },
        { suit: 'spades', value: '2' }
      ];

      const groups = service['groupCardsByValue'](cards);
      
      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['K'].cards).toHaveLength(2);
      expect(groups['2'].cards).toHaveLength(1);
    });

    it('should handle empty input', () => {
      const groups = service['groupCardsByValue']([]);
      expect(Object.keys(groups)).toHaveLength(0);
    });
  });
}); 