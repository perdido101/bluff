import { ResponseGenerationService } from '../responseGenerationService';
import { AIPersonalityService } from '../aiPersonalityService';
import { ChatAnalysisService } from '../chatAnalysisService';
import { GameState, GameAction } from '../../types';

describe('ResponseGenerationService', () => {
  let service: ResponseGenerationService;
  let mockAIPersonality: jest.Mocked<AIPersonalityService>;
  let mockChatAnalysis: jest.Mocked<ChatAnalysisService>;

  const createMockGameState = (
    currentTurn: 'player' | 'ai' = 'player',
    winner: 'player' | 'ai' | null = null,
    lastPlay = null
  ): GameState => ({
    aiHand: 5,
    playerHand: [{ suit: 'hearts', value: '2' }],
    centerPile: [],
    currentTurn,
    winner,
    lastPlay
  });

  beforeEach(() => {
    mockAIPersonality = {
      getPersonalityTraits: jest.fn()
    } as any;

    mockChatAnalysis = {
      analyzeChatMessage: jest.fn()
    } as any;

    service = new ResponseGenerationService(mockAIPersonality, mockChatAnalysis);
  });

  describe('Response Generation', () => {
    it('should generate confident bluffing response', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        lastAction: {
          type: 'PLAY_CARDS',
          payload: { declaredValue: 'A', cards: [] }
        },
        aiPersonality: {
          confidence: 0.8,
          aggressiveness: 0.3,
          playfulness: 0.5
        }
      };

      mockChatAnalysis.analyzeChatMessage.mockResolvedValue({
        sentiment: { score: 0.5, dominantEmotion: 'confident', confidence: 0.8 },
        bluffIndicators: { probability: 0.2, confidence: 0.7, triggers: [] },
        personalityInsights: { confidence: 0.7, traits: {} },
        contextRelevance: 0.8,
        keyPhrases: []
      });

      const response = await service.generateResponse(context);
      expect(response).toContain('definitely');
      expect(response).toContain('A');
    });

    it('should generate nervous bluffing response', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        lastAction: {
          type: 'PLAY_CARDS',
          payload: { declaredValue: 'K', cards: [] }
        },
        aiPersonality: {
          confidence: 0.3,
          aggressiveness: 0.2,
          playfulness: 0.7
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toContain('think');
      expect(response).toContain('K');
      expect(response).toContain('😉');
    });

    it('should generate aggressive challenge response', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        lastAction: {
          type: 'CHALLENGE'
        },
        aiPersonality: {
          confidence: 0.7,
          aggressiveness: 0.8,
          playfulness: 0.3
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toBe(response.toUpperCase());
      expect(response).toContain('NICE TRY');
    });

    it('should generate playful victory response', async () => {
      const context = {
        gameState: createMockGameState('ai', 'ai'),
        aiPersonality: {
          confidence: 0.6,
          aggressiveness: 0.2,
          playfulness: 0.8
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toContain('Good game');
      expect(response).toContain('😉');
    });
  });

  describe('Context Handling', () => {
    it('should consider player message in response', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        playerMessage: "I'm definitely not bluffing!",
        aiPersonality: {
          confidence: 0.7,
          aggressiveness: 0.6,
          playfulness: 0.4
        }
      };

      mockChatAnalysis.analyzeChatMessage.mockResolvedValue({
        sentiment: { score: 0.8, dominantEmotion: 'confident', confidence: 0.9 },
        bluffIndicators: { probability: 0.7, confidence: 0.8, triggers: ['overemphasis'] },
        personalityInsights: { confidence: 0.7, traits: {} },
        contextRelevance: 0.9,
        keyPhrases: []
      });

      const response = await service.generateResponse(context);
      expect(response).toContain('suspicious');
    });

    it('should adapt to game state changes', async () => {
      const context = {
        gameState: createMockGameState('player'),
        lastAction: {
          type: 'PLAY_CARDS',
          payload: { declaredValue: 'Q', cards: [] }
        },
        aiPersonality: {
          confidence: 0.5,
          aggressiveness: 0.5,
          playfulness: 0.5
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toContain('turn');
    });

    it('should provide default response when no template matches', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        aiPersonality: {
          confidence: 0.5,
          aggressiveness: 0.5,
          playfulness: 0.5
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toBe('Hmm...');
    });
  });

  describe('Personality Integration', () => {
    it('should add emotional markers for high confidence', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        aiPersonality: {
          confidence: 0.9,
          aggressiveness: 0.3,
          playfulness: 0.4
        }
      };

      const response = await service.generateResponse(context);
      expect(response.endsWith('!')).toBe(true);
    });

    it('should add playful emoji for high playfulness', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        aiPersonality: {
          confidence: 0.5,
          aggressiveness: 0.3,
          playfulness: 0.8
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toContain('😉');
    });

    it('should use uppercase for high aggressiveness', async () => {
      const context = {
        gameState: createMockGameState('ai'),
        aiPersonality: {
          confidence: 0.5,
          aggressiveness: 0.8,
          playfulness: 0.4
        },
        lastAction: {
          type: 'CHALLENGE'
        }
      };

      const response = await service.generateResponse(context);
      expect(response).toBe(response.toUpperCase());
    });
  });
}); 