import axios from 'axios';
import { GameState, GameAction } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  async initializeGame(): Promise<GameState> {
    const response = await axios.get(`${API_URL}/api/game/initialize`);
    return response.data;
  },

  async makeMove(action: GameAction, gameState: GameState): Promise<GameState> {
    const response = await axios.post(`${API_URL}/api/game/move`, {
      action,
      gameState
    });
    return response.data;
  },

  async getAIDecision(gameState: GameState): Promise<GameAction> {
    const response = await axios.post(`${API_URL}/api/ai/decision`, {
      gameState
    });
    return response.data;
  }
}; 