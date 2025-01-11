import { GameState, Card, GameAction } from '../../types';

export const createMockCard = (value: string, suit: string): Card => ({
  value: value as Card['value'],
  suit: suit as Card['suit']
});

export const createMockGameState = (partial?: Partial<GameState>): GameState => ({
  playerHand: [
    createMockCard('A', 'hearts'),
    createMockCard('K', 'spades')
  ],
  aiHand: 2,
  centerPile: [],
  currentTurn: 'player',
  lastPlay: undefined,
  ...partial
});

export const createMockAction = (type: GameAction['type'], payload?: GameAction['payload']): GameAction => ({
  type,
  payload
}); 