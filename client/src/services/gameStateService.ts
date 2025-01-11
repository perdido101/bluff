import { GameState } from '../types';

const GAME_STATE_KEY = 'bluff_game_state';

export const gameStateService = {
  saveGame(gameState: GameState): void {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  },

  loadGame(): GameState | null {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  clearGame(): void {
    localStorage.removeItem(GAME_STATE_KEY);
  }
}; 