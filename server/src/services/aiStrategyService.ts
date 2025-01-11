import { GameState, GameAction } from '../types';

interface PlayerStats {
  bluffFrequency: number;
  challengeFrequency: number;
  totalMoves: number;
  playStyle: 'aggressive' | 'conservative' | 'balanced';
}

export class AIStrategyService {
  private playerStats: PlayerStats = {
    bluffFrequency: 0,
    challengeFrequency: 0,
    totalMoves: 0,
    playStyle: 'balanced'
  };

  updatePlayerPatterns(action: GameAction, wasSuccessful: boolean) {
    this.playerStats.totalMoves++;

    if (action.type === 'PLAY_CARDS') {
      this.playerStats.bluffFrequency = 
        (this.playerStats.bluffFrequency * (this.playerStats.totalMoves - 1) + (wasSuccessful ? 1 : 0)) 
        / this.playerStats.totalMoves;
    }

    if (action.type === 'CHALLENGE') {
      this.playerStats.challengeFrequency = 
        (this.playerStats.challengeFrequency * (this.playerStats.totalMoves - 1) + (wasSuccessful ? 1 : 0)) 
        / this.playerStats.totalMoves;
    }

    // Update play style based on patterns
    if (this.playerStats.bluffFrequency > 0.6 || this.playerStats.challengeFrequency > 0.6) {
      this.playerStats.playStyle = 'aggressive';
    } else if (this.playerStats.bluffFrequency < 0.3 && this.playerStats.challengeFrequency < 0.3) {
      this.playerStats.playStyle = 'conservative';
    } else {
      this.playerStats.playStyle = 'balanced';
    }
  }

  getPlayerAnalysis() {
    return this.playerStats;
  }

  calculateBluffProbability(gameState: GameState): number {
    const cardsPlayed = gameState.lastPlay?.actualCards.length || 0;
    const remainingCards = gameState.playerHand.length;
    
    // Higher probability of bluff if:
    // 1. Player has few cards left
    // 2. Many cards were played
    // 3. Player has high bluff frequency
    return (cardsPlayed / 4) * 0.4 + 
           ((13 - remainingCards) / 13) * 0.3 + 
           this.playerStats.bluffFrequency * 0.3;
  }
} 