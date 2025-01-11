import { GameState, Move, Card } from '../types/game';

export interface CardCombo {
  cards: Card[];
  declaredValue: string;
  wasBluff: boolean;
}

export interface PlayerMove {
  cards: Card[];
  declaredValue: string;
  wasBluff: boolean;
  gameState: GameState;
  timestamp: number;
}

export interface ChallengeData {
  success: boolean;
  opponentMove: PlayerMove;
  gameState: GameState;
  timestamp: number;
}

export interface PlayerBehaviorData {
  playerId: string;
  moves: PlayerMove[];
  challenges: ChallengeData[];
  bluffFrequency: number;
  challengeSuccessRate: number;
  preferredCardCombos: CardCombo[];
  sessionStartTime: number;
  lastUpdated: number;
}

export class DataCollector {
  private playerData: Map<string, PlayerBehaviorData> = new Map();

  private calculateBluffFrequency(moves: PlayerMove[]): number {
    if (moves.length === 0) return 0;
    const bluffs = moves.filter(move => move.wasBluff).length;
    return bluffs / moves.length;
  }

  private calculateChallengeSuccessRate(challenges: ChallengeData[]): number {
    if (challenges.length === 0) return 0;
    const successful = challenges.filter(challenge => challenge.success).length;
    return successful / challenges.length;
  }

  public recordMove(playerId: string, move: PlayerMove): void {
    let data = this.playerData.get(playerId);
    
    if (!data) {
      data = {
        playerId,
        moves: [],
        challenges: [],
        bluffFrequency: 0,
        challengeSuccessRate: 0,
        preferredCardCombos: [],
        sessionStartTime: Date.now(),
        lastUpdated: Date.now()
      };
      this.playerData.set(playerId, data);
    }

    data.moves.push(move);
    data.bluffFrequency = this.calculateBluffFrequency(data.moves);
    data.lastUpdated = Date.now();
    
    // Update preferred card combinations
    const combo: CardCombo = {
      cards: move.cards,
      declaredValue: move.declaredValue,
      wasBluff: move.wasBluff
    };
    
    if (!data.preferredCardCombos.some(c => 
      c.cards.length === combo.cards.length && 
      c.declaredValue === combo.declaredValue
    )) {
      data.preferredCardCombos.push(combo);
    }
  }

  public recordChallenge(playerId: string, challenge: ChallengeData): void {
    let data = this.playerData.get(playerId);
    
    if (!data) {
      data = {
        playerId,
        moves: [],
        challenges: [],
        bluffFrequency: 0,
        challengeSuccessRate: 0,
        preferredCardCombos: [],
        sessionStartTime: Date.now(),
        lastUpdated: Date.now()
      };
      this.playerData.set(playerId, data);
    }

    data.challenges.push(challenge);
    data.challengeSuccessRate = this.calculateChallengeSuccessRate(data.challenges);
    data.lastUpdated = Date.now();
  }

  public getPlayerData(playerId: string): PlayerBehaviorData | undefined {
    return this.playerData.get(playerId);
  }

  public getAllPlayersData(): PlayerBehaviorData[] {
    return Array.from(this.playerData.values());
  }
} 