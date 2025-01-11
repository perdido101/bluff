import { GameService } from './GameService';
import { GameAction } from '../types/game';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  describe('Game Initialization', () => {
    it('should initialize game with correct state', () => {
      const state = gameService.getGameState();
      
      expect(state.players).toHaveLength(2);
      expect(state.players[0].hand).toHaveLength(26); // Half deck
      expect(state.players[1].hand).toHaveLength(26); // Half deck
      expect(state.currentPlayer).toBe('player');
      expect(state.pile).toHaveLength(0);
      expect(state.lastMove).toBeNull();
      expect(state.gameStatus).toBe('playing');
      expect(state.winner).toBeNull();
    });
  });

  describe('Move Validation', () => {
    it('should reject invalid moves', () => {
      const invalidMove: GameAction = {
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [{ suit: 'hearts', value: 'A' }], // Card not in hand
          declaredValue: 'A'
        }
      };

      expect(() => gameService.makeMove(invalidMove)).toThrow('Invalid move');
    });

    it('should reject challenges when no last move exists', () => {
      const invalidChallenge: GameAction = {
        type: 'CHALLENGE',
        playerId: 'player'
      };

      expect(() => gameService.makeMove(invalidChallenge)).toThrow('Invalid move');
    });
  });

  describe('Game Flow', () => {
    it('should handle valid card plays', () => {
      const state = gameService.getGameState();
      const card = state.players[0].hand[0];
      
      const move: GameAction = {
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [card],
          declaredValue: card.value
        }
      };

      const newState = gameService.makeMove(move);
      expect(newState.pile).toHaveLength(1);
      expect(newState.currentPlayer).toBe('ai');
      expect(newState.players[0].hand).toHaveLength(25);
    });

    it('should handle passing', () => {
      const move: GameAction = {
        type: 'PASS',
        playerId: 'player'
      };

      const newState = gameService.makeMove(move);
      expect(newState.currentPlayer).toBe('ai');
    });

    it('should detect winner when player has no cards', () => {
      const state = gameService.getGameState();
      state.players[0].hand = [state.players[0].hand[0]]; // Leave only one card
      
      const move: GameAction = {
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [state.players[0].hand[0]],
          declaredValue: state.players[0].hand[0].value
        }
      };

      const newState = gameService.makeMove(move);
      expect(newState.gameStatus).toBe('finished');
      expect(newState.winner).toBe('player');
    });
  });

  describe('AI Interaction', () => {
    it('should trigger AI move after player move', () => {
      const state = gameService.getGameState();
      const card = state.players[0].hand[0];
      
      const move: GameAction = {
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [card],
          declaredValue: card.value
        }
      };

      const newState = gameService.makeMove(move);
      // After player move and AI move
      expect(newState.currentPlayer).toBe('player');
    });
  });

  describe('Game Reset', () => {
    it('should reset game to initial state', () => {
      const initialState = gameService.getGameState();
      
      // Make some moves
      const card = initialState.players[0].hand[0];
      gameService.makeMove({
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [card],
          declaredValue: card.value
        }
      });

      gameService.resetGame();
      const resetState = gameService.getGameState();

      expect(resetState.players[0].hand).toHaveLength(26);
      expect(resetState.pile).toHaveLength(0);
      expect(resetState.currentPlayer).toBe('player');
      expect(resetState.gameStatus).toBe('playing');
    });
  });
}); 