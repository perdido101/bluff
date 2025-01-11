import { Card, GameState, GameAction, Player } from '../types/game';

export class AIPlayer {
  private id: string;
  private gameHistory: GameAction[] = [];

  constructor(id: string) {
    this.id = id;
  }

  private calculateProbability(gameState: GameState, declaredValue: string): number {
    const totalCards = 52;
    const cardsOfValue = 4; // 4 cards of each value in a deck
    const knownCards = gameState.pile;
    const remainingCards = totalCards - knownCards.length;
    
    const knownCardsOfValue = knownCards.filter(card => card.value === declaredValue).length;
    const remainingCardsOfValue = cardsOfValue - knownCardsOfValue;
    
    return remainingCardsOfValue / remainingCards;
  }

  private shouldChallenge(gameState: GameState): boolean {
    if (!gameState.lastMove) return false;

    const probability = this.calculateProbability(gameState, gameState.lastMove.declaredValue);
    const threshold = 0.3; // Adjust this value to make AI more or less aggressive
    
    return probability < threshold;
  }

  private getBestMove(hand: Card[]): { cards: Card[]; declaredValue: string } {
    // Group cards by value
    const cardGroups = hand.reduce((groups, card) => {
      groups[card.value] = groups[card.value] || [];
      groups[card.value].push(card);
      return groups;
    }, {} as Record<string, Card[]>);

    // Find the largest group
    let maxCount = 0;
    let bestValue = '';
    for (const [value, cards] of Object.entries(cardGroups)) {
      if (cards.length > maxCount) {
        maxCount = cards.length;
        bestValue = value;
      }
    }

    return {
      cards: cardGroups[bestValue],
      declaredValue: bestValue
    };
  }

  public makeMove(gameState: GameState): GameAction {
    const player = gameState.players.find(p => p.id === this.id);
    if (!player) throw new Error('AI player not found in game state');

    // If there's a last move and we think it's a bluff, challenge
    if (gameState.lastMove && this.shouldChallenge(gameState)) {
      return {
        type: 'CHALLENGE',
        playerId: this.id
      };
    }

    // If we have cards to play, make the best move
    const move = this.getBestMove(player.hand);
    if (move.cards.length > 0) {
      return {
        type: 'PLAY_CARDS',
        playerId: this.id,
        payload: {
          cards: move.cards,
          declaredValue: move.declaredValue
        }
      };
    }

    // If we can't make a good move, pass
    return {
      type: 'PASS',
      playerId: this.id
    };
  }

  public recordMove(action: GameAction): void {
    this.gameHistory.push(action);
  }
} 