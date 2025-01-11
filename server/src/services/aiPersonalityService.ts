import { GameState } from '../types';

type AIPersonality = 'aggressive' | 'conservative' | 'balanced' | 'unpredictable';

interface PersonalityTraits {
  bluffFrequency: number;
  challengeThreshold: number;
  riskTolerance: number;
  adaptiveRate: number;
}

export class AIPersonalityService {
  private personality: AIPersonality = 'balanced';
  private traits: Record<AIPersonality, PersonalityTraits> = {
    aggressive: {
      bluffFrequency: 0.7,
      challengeThreshold: 0.3,
      riskTolerance: 0.8,
      adaptiveRate: 0.5
    },
    conservative: {
      bluffFrequency: 0.3,
      challengeThreshold: 0.7,
      riskTolerance: 0.3,
      adaptiveRate: 0.3
    },
    balanced: {
      bluffFrequency: 0.5,
      challengeThreshold: 0.5,
      riskTolerance: 0.5,
      adaptiveRate: 0.5
    },
    unpredictable: {
      bluffFrequency: Math.random(),
      challengeThreshold: Math.random(),
      riskTolerance: Math.random(),
      adaptiveRate: 0.8
    }
  };

  setPersonality(newPersonality: AIPersonality) {
    this.personality = newPersonality;
    if (newPersonality === 'unpredictable') {
      this.updateUnpredictableTraits();
    }
  }

  private updateUnpredictableTraits() {
    this.traits.unpredictable = {
      bluffFrequency: Math.random(),
      challengeThreshold: Math.random(),
      riskTolerance: Math.random(),
      adaptiveRate: 0.8
    };
  }

  getPersonalityTraits() {
    if (this.personality === 'unpredictable') {
      this.updateUnpredictableTraits();
    }
    return this.traits[this.personality];
  }

  shouldBluff(gameState: GameState): boolean {
    const traits = this.getPersonalityTraits();
    const randomFactor = Math.random();
    return randomFactor < traits.bluffFrequency;
  }

  shouldChallenge(confidence: number): boolean {
    const traits = this.getPersonalityTraits();
    return confidence > traits.challengeThreshold;
  }
} 