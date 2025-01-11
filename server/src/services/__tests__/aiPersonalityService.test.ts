import { AIPersonalityService } from '../aiPersonalityService';
import { createMockGameState } from './setup';

describe('AIPersonalityService', () => {
  let service: AIPersonalityService;

  beforeEach(() => {
    service = new AIPersonalityService();
  });

  test('default personality is balanced', () => {
    const traits = service.getPersonalityTraits();
    expect(traits.bluffFrequency).toBe(0.5);
    expect(traits.challengeThreshold).toBe(0.5);
  });

  test('changes personality correctly', () => {
    service.setPersonality('aggressive');
    const traits = service.getPersonalityTraits();
    expect(traits.bluffFrequency).toBeGreaterThan(0.5);
    expect(traits.challengeThreshold).toBeLessThan(0.5);
  });

  test('unpredictable personality changes on each get', () => {
    service.setPersonality('unpredictable');
    const traits1 = service.getPersonalityTraits();
    const traits2 = service.getPersonalityTraits();
    expect(traits1).not.toEqual(traits2);
  });

  test('shouldBluff considers game state', () => {
    const gameState = createMockGameState();
    const result = service.shouldBluff(gameState);
    expect(typeof result).toBe('boolean');
  });
}); 