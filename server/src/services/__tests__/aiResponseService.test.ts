import { AIResponseService } from '../aiResponseService';
import { GameState, GameAction } from '../../types';
import { ChatAnalysisResult } from '../chatAnalysisService';

describe('AIResponseService', () => {
  let service: AIResponseService;
  
  const mockGameState: GameState = {
    playerHand: [],
    aiHand: 5,
    centerPile: [],
    lastPlay: null
  } as GameState;

  const mockPersonality = {
    confidence: 0.6,
    aggression: 0.4,
    deception: 0.5,
    friendliness: 0.7
  };

  beforeEach(() => {
    service = new AIResponseService();
  });

  describe('generateResponse', () => {
    it('should generate challenge response based on personality', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: {
          ...mockPersonality,
          confidence: 0.9
        }
      };

      const response = await service.generateResponse('CHALLENGE_RESPONSE', context);
      expect(response).toContain('!'); // High confidence modification
    });

    it('should generate aggressive response when appropriate', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: {
          ...mockPersonality,
          aggression: 0.8
        }
      };

      const response = await service.generateResponse('TAUNT', context);
      expect(response).toBe(response.toUpperCase()); // Aggressive modification
    });

    it('should add friendly emoji for high friendliness', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: {
          ...mockPersonality,
          friendliness: 0.8
        }
      };

      const response = await service.generateResponse('COMPLIMENT', context);
      expect(response).toContain('😊');
    });
  });

  describe('generateResponseToChat', () => {
    const mockChatAnalysis: ChatAnalysisResult = {
      sentiment: {
        score: 0.5,
        confidence: 0.8,
        emotion: 'confident'
      },
      bluffIndicators: {
        probability: 0.3,
        confidence: 0.7,
        triggers: []
      },
      keyPhrases: ['play', 'cards'],
      personalityInsights: {
        dominance: 0.5,
        confidence: 0.6,
        aggressiveness: 0.4,
        deception: 0.3
      },
      contextualScore: 0.7
    };

    it('should respond to bluff indicators', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: mockPersonality,
        chatAnalysis: {
          ...mockChatAnalysis,
          bluffIndicators: {
            probability: 0.8,
            confidence: 0.7,
            triggers: ['trust me']
          }
        }
      };

      const response = await service.generateResponseToChat(
        "Trust me, these are definitely aces",
        context
      );
      
      expect(response).toBeTruthy();
      // Should be a taunt response due to high bluff probability
      expect(response.toLowerCase()).toMatch(/nervous|read|best/);
    });

    it('should respond to aggressive messages', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: mockPersonality,
        chatAnalysis: {
          ...mockChatAnalysis,
          sentiment: {
            score: -0.3,
            confidence: 0.8,
            emotion: 'aggressive'
          }
        }
      };

      const response = await service.generateResponseToChat(
        "You're going down this time!",
        context
      );
      
      expect(response).toBeTruthy();
    });

    it('should consider game phase in responses', async () => {
      const lateGameState: GameState = {
        ...mockGameState,
        playerHand: [],
        aiHand: 2
      };

      const context = {
        gameState: lateGameState,
        aiPersonality: mockPersonality,
        chatAnalysis: mockChatAnalysis
      };

      const response = await service.generateResponseToChat(
        "Almost over now",
        context
      );
      
      expect(response).toBeTruthy();
      // Should use late game specific responses
      expect(response.toLowerCase()).toMatch(/crucial|final|end/);
    });
  });

  describe('response consistency', () => {
    it('should maintain personality consistency across responses', async () => {
      const context = {
        gameState: mockGameState,
        aiPersonality: mockPersonality
      };

      const responses = await Promise.all([
        service.generateResponse('CARD_PLAY', context),
        service.generateResponse('TAUNT', context),
        service.generateResponse('COMPLIMENT', context)
      ]);

      // All responses should have consistent personality markers
      const allHaveSameStyle = responses.every(response => 
        response.endsWith('😊') === responses[0].endsWith('😊')
      );
      
      expect(allHaveSameStyle).toBe(true);
    });

    it('should adapt response style based on game progress', async () => {
      const earlyGameState = { ...mockGameState, playerHand: new Array(20), aiHand: 20 };
      const lateGameState = { ...mockGameState, playerHand: new Array(2), aiHand: 2 };

      const earlyResponse = await service.generateResponse('CARD_PLAY', {
        gameState: earlyGameState,
        aiPersonality: mockPersonality
      });

      const lateResponse = await service.generateResponse('CARD_PLAY', {
        gameState: lateGameState,
        aiPersonality: mockPersonality
      });

      expect(earlyResponse).not.toBe(lateResponse);
    });
  });

  describe('bluff handling', () => {
    it('should adjust responses when AI is bluffing', async () => {
      const bluffAction: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: '2' }],
          declaredValue: 'A'
        }
      };

      const context = {
        gameState: mockGameState,
        lastAction: bluffAction,
        aiPersonality: {
          ...mockPersonality,
          deception: 0.8
        }
      };

      const response = await service.generateResponse('BLUFF_DEFENSE', context);
      expect(response).toBeTruthy();
      // Should use more deceptive language
      expect(response.toLowerCase()).toMatch(/trust|assure|believe/);
    });

    it('should maintain confidence when defending true claims', async () => {
      const honestAction: GameAction = {
        type: 'PLAY_CARDS',
        payload: {
          cards: [{ suit: 'hearts', value: 'A' }],
          declaredValue: 'A'
        }
      };

      const context = {
        gameState: mockGameState,
        lastAction: honestAction,
        aiPersonality: {
          ...mockPersonality,
          confidence: 0.9
        }
      };

      const response = await service.generateResponse('BLUFF_DEFENSE', context);
      expect(response).toBeTruthy();
      // Should use confident language
      expect(response.toLowerCase()).toMatch(/exactly|certainly|definitely/);
    });
  });
}); 