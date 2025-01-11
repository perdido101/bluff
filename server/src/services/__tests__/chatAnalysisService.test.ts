import { ChatAnalysisService } from '../chatAnalysisService';
import { GameState } from '../../types';

describe('ChatAnalysisService', () => {
  let service: ChatAnalysisService;

  const createMockGameState = (
    aiCards = 5,
    playerCards = 5,
    lastPlay = null
  ): GameState => ({
    aiHand: aiCards,
    playerHand: Array(playerCards).fill({ suit: 'hearts', value: '2' }),
    centerPile: [],
    lastPlay,
    currentTurn: 'player'
  });

  beforeEach(() => {
    service = new ChatAnalysisService();
  });

  describe('Sentiment Analysis', () => {
    it('should detect confident sentiment', async () => {
      const message = "I definitely have these cards, trust me on this one!";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.sentiment.dominantEmotion).toBe('confident');
      expect(result.sentiment.score).toBeGreaterThan(0);
      expect(result.sentiment.confidence).toBeGreaterThan(0.5);
    });

    it('should detect nervous sentiment', async () => {
      const message = "Uh... maybe these are aces? I'm not really sure...";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.sentiment.dominantEmotion).toBe('nervous');
      expect(result.sentiment.score).toBeLessThan(0);
      expect(result.sentiment.emotions.nervous).toBeGreaterThan(0.5);
    });

    it('should detect aggressive sentiment', async () => {
      const message = "Come on, seriously? Whatever, just play your cards!";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.sentiment.dominantEmotion).toBe('aggressive');
      expect(result.sentiment.emotions.aggressive).toBeGreaterThan(0.5);
    });

    it('should handle neutral messages', async () => {
      const message = "I play these cards";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.sentiment.emotions.neutral).toBeGreaterThan(0.5);
      expect(Math.abs(result.sentiment.score)).toBeLessThan(0.3);
    });
  });

  describe('Bluff Detection', () => {
    it('should detect potential bluff through overemphasis', async () => {
      const message = "I absolutely, definitely, 100% have these aces!";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.bluffIndicators.probability).toBeGreaterThan(0.5);
      expect(result.bluffIndicators.triggers).toContain('overemphasis');
    });

    it('should detect uncertainty as bluff indicator', async () => {
      const message = "Uh... like... these are kind of aces, sort of";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.bluffIndicators.probability).toBeGreaterThan(0.3);
      expect(result.bluffIndicators.triggers).toContain('uncertainty');
    });

    it('should consider game state in bluff detection', async () => {
      const gameState = createMockGameState(5, 2, {
        player: 'player',
        actualCards: [{ suit: 'hearts', value: '2' }, { suit: 'diamonds', value: '2' }],
        declaredCards: ['A', 'A']
      });

      const message = "These are definitely aces!";
      const result = await service.analyzeChatMessage(message, gameState);

      expect(result.bluffIndicators.probability).toBeGreaterThan(0.6);
    });

    it('should detect multiple bluff indicators', async () => {
      const message = "Well... obviously these are aces, whatever, moving on";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.bluffIndicators.triggers.length).toBeGreaterThan(1);
      expect(result.bluffIndicators.triggers).toContain('deflection');
      expect(result.bluffIndicators.triggers).toContain('overemphasis');
    });
  });

  describe('Personality Analysis', () => {
    it('should analyze aggressive personality traits', async () => {
      const message = "Come on, seriously? Just play already! Whatever!";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.personalityInsights.traits.aggressiveness).toBeGreaterThan(0.5);
      expect(result.personalityInsights.confidence).toBeGreaterThan(0.5);
    });

    it('should detect deceptive personality traits', async () => {
      const message = "Well, actually... I mean, sort of... whatever";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.personalityInsights.traits.deceptiveness).toBeGreaterThan(0.3);
    });

    it('should analyze confidence levels', async () => {
      const message = "I know exactly what I'm doing, trust me on this";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.personalityInsights.traits.confidence).toBeGreaterThan(0.5);
    });

    it('should detect impulsiveness', async () => {
      const message = "NO WAY!! THESE ARE DEFINITELY ACES!!!";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.personalityInsights.traits.impulsiveness).toBeGreaterThan(0.5);
    });
  });

  describe('Context Relevance', () => {
    it('should identify game-related messages', async () => {
      const message = "I play these three aces from my hand";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.contextRelevance).toBeGreaterThan(0.5);
      expect(result.keyPhrases).toContain('ace');
      expect(result.keyPhrases).toContain('three');
    });

    it('should handle off-topic messages', async () => {
      const message = "How's the weather today?";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.contextRelevance).toBeLessThan(0.2);
      expect(result.keyPhrases.length).toBe(0);
    });

    it('should extract multiple key phrases', async () => {
      const message = "I play two kings and challenge your three aces";
      const result = await service.analyzeChatMessage(message, createMockGameState());

      expect(result.keyPhrases).toContain('king');
      expect(result.keyPhrases).toContain('ace');
      expect(result.keyPhrases).toContain('two');
      expect(result.keyPhrases).toContain('three');
      expect(result.keyPhrases).toContain('challenge');
    });
  });
}); 