import { GameState, GameAction } from '../types';
import { PersistenceService } from './persistenceService';

interface GameHistory {
  id: string;
  timestamp: number;
  moves: {
    action: GameAction;
    resultingState: GameState;
    wasBluff?: boolean;
  }[];
  winner: 'player' | 'ai';
  duration: number;
}

export class GameHistoryService {
  private currentGame?: {
    id: string;
    startTime: number;
    moves: GameHistory['moves'];
  };

  constructor(private persistenceService: PersistenceService) {}

  startNewGame() {
    this.currentGame = {
      id: Date.now().toString(),
      startTime: Date.now(),
      moves: []
    };
  }

  recordMove(action: GameAction, resultingState: GameState, wasBluff?: boolean) {
    if (!this.currentGame) {
      this.startNewGame();
    }

    this.currentGame!.moves.push({
      action,
      resultingState,
      wasBluff
    });
  }

  async endGame(winner: 'player' | 'ai') {
    if (!this.currentGame) return;

    const gameHistory: GameHistory = {
      id: this.currentGame.id,
      timestamp: this.currentGame.startTime,
      moves: this.currentGame.moves,
      winner,
      duration: Date.now() - this.currentGame.startTime
    };

    await this.persistenceService.saveGameHistory(gameHistory);
    this.currentGame = undefined;
  }

  async getGameHistory(): Promise<GameHistory[]> {
    return this.persistenceService.loadGameHistory();
  }
} 