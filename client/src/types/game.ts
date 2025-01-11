export type Card = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
};

export type Player = {
  id: string;
  hand: Card[];
  isAI: boolean;
};

export type GameState = {
  players: Player[];
  currentPlayer: string;
  pile: Card[];
  lastMove: {
    playerId: string;
    declaredValue: string;
    numberOfCards: number;
  } | null;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: string | null;
};

export type GameAction = {
  type: 'PLAY_CARDS' | 'CHALLENGE' | 'PASS';
  playerId: string;
  payload?: {
    cards?: Card[];
    declaredValue?: string;
  };
}; 