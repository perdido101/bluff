import { AIPlayer } from './AIPlayer';
import { GameState, Card } from '../types/game';

describe('AIPlayer', () => {
  let aiPlayer: AIPlayer;
  let mockGameState: GameState;

  beforeEach(() => {
    aiPlayer = new AIPlayer('ai');
    mockGameState = {
      players: [
        {
          id: 'ai',
          hand: [
            { suit: 'hearts', value: 'A' },
            { suit: 'diamonds', value: 'A' },
            { suit: 'clubs', value: '2' }
          ],
          isAI: true
        },
        {
          id: 'player',
          hand: [],
          isAI: false
        }
      ],
      currentPlayer: 'ai',
      pile: [],
      lastMove: null,
      gameStatus: 'playing',
      winner: null
    };
  });

  it('should make a move with the best cards when possible', () => {
    const action = aiPlayer.makeMove(mockGameState);
    
    expect(action.type).toBe('PLAY_CARDS');
    expect(action.playerId).toBe('ai');
    expect(action.payload?.cards).toHaveLength(2);
    expect(action.payload?.declaredValue).toBe('A');
  });

  it('should challenge when probability is low', () => {
    mockGameState.lastMove = {
      playerId: 'player',
      declaredValue: 'K',
      numberOfCards: 3
    };
    mockGameState.pile = Array(3).fill({ suit: 'hearts', value: '2' });

    const action = aiPlayer.makeMove(mockGameState);
    
    expect(action.type).toBe('CHALLENGE');
    expect(action.playerId).toBe('ai');
  });

  it('should pass when no good moves are available', () => {
    mockGameState.players[0].hand = [];
    const action = aiPlayer.makeMove(mockGameState);
    
    expect(action.type).toBe('PASS');
    expect(action.playerId).toBe('ai');
  });

  it('should record moves in game history', () => {
    const move = {
      type: 'PLAY_CARDS' as const,
      playerId: 'ai',
      payload: {
        cards: [{ suit: 'hearts', value: 'A' }],
        declaredValue: 'A'
      }
    };

    aiPlayer.recordMove(move);
    // Note: We can't directly test private properties, but we could add a getter if needed
    expect(() => aiPlayer.recordMove(move)).not.toThrow();
  });
}); 