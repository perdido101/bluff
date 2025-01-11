export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface GameState {
  playerHand: Card[];
  aiHand: number;
  centerPile: Card[];
  currentTurn: 'player' | 'ai';
  lastPlay?: {
    player: 'player' | 'ai';
    declaredCards: string;
    actualCards: Card[];
  };
}

export interface GameAction {
  type: 'PLAY_CARDS' | 'CHALLENGE' | 'PASS';
  payload?: {
    cards: Card[];
    declaredValue: string;
  };
} 