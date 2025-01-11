import { GameState } from '../types';

const GAME_STATE_KEY = 'bluff_game_state';
const GAME_STATS_KEY = 'bluff_game_stats';

interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  averageMovesPerGame: number;
  totalMoves: number;
}

export const storageService = {
  saveGameState(state: GameState): void {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  },

  loadGameState(): GameState | null {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  clearGameState(): void {
    localStorage.removeItem(GAME_STATE_KEY);
  },

  updateGameStats(won: boolean, moves: number): void {
    const stats = this.loadGameStats();
    const updatedStats: GameStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (won ? 1 : 0),
      losses: stats.losses + (won ? 0 : 1),
      totalMoves: stats.totalMoves + moves,
      averageMovesPerGame: (stats.totalMoves + moves) / (stats.gamesPlayed + 1)
    };
    localStorage.setItem(GAME_STATS_KEY, JSON.stringify(updatedStats));
  },

  loadGameStats(): GameStats {
    const saved = localStorage.getItem(GAME_STATS_KEY);
    return saved ? JSON.parse(saved) : {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      averageMovesPerGame: 0,
      totalMoves: 0
    };
  }
}; 