import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { GameBoard } from '../../components/GameBoard/GameBoard';
import { GameService } from '../../services/GameService';

describe('Performance Integration', () => {
  let gameService: GameService;
  let perfData: {
    renderTime: number;
    moveTime: number;
    memoryUsage: number;
  };

  beforeEach(() => {
    gameService = new GameService();
    perfData = {
      renderTime: 0,
      moveTime: 0,
      memoryUsage: 0
    };
  });

  describe('Render Performance', () => {
    it('renders initial game board within performance budget', () => {
      const startTime = performance.now();

      render(
        <GameBoard
          gameState={gameService.getGameState()}
          onAction={() => {}}
          playerId="player"
        />
      );

      const endTime = performance.now();
      perfData.renderTime = endTime - startTime;

      // Initial render should be under 100ms
      expect(perfData.renderTime).toBeLessThan(100);
    });

    it('maintains performance with large hand sizes', () => {
      // Create a game state with maximum hand size
      const largeState = {
        ...gameService.getGameState(),
        players: [
          {
            id: 'player',
            hand: Array(52).fill({ suit: 'hearts', value: 'A' }),
            isAI: false
          },
          {
            id: 'ai',
            hand: [],
            isAI: true
          }
        ]
      };

      const startTime = performance.now();

      render(
        <GameBoard
          gameState={largeState}
          onAction={() => {}}
          playerId="player"
        />
      );

      const endTime = performance.now();
      perfData.renderTime = endTime - startTime;

      // Even with large hands, render should be under 200ms
      expect(perfData.renderTime).toBeLessThan(200);
    });
  });

  describe('Move Performance', () => {
    it('processes moves within performance budget', async () => {
      let currentState = gameService.getGameState();

      render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            const startTime = performance.now();
            currentState = gameService.makeMove(action);
            const endTime = performance.now();
            perfData.moveTime = endTime - startTime;
          }}
          playerId="player"
        />
      );

      // Make a move
      const firstCard = screen.getAllByRole('button')[0];
      fireEvent.click(firstCard);

      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });
      
      fireEvent.click(screen.getByText('Play Cards'));

      // Move processing should be under 50ms
      expect(perfData.moveTime).toBeLessThan(50);
    });

    it('maintains performance during rapid moves', async () => {
      let currentState = gameService.getGameState();
      const moveTimes: number[] = [];

      render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            const startTime = performance.now();
            currentState = gameService.makeMove(action);
            const endTime = performance.now();
            moveTimes.push(endTime - startTime);
          }}
          playerId="player"
        />
      );

      // Make multiple rapid moves
      for (let i = 0; i < 5; i++) {
        const card = screen.getAllByRole('button')[i];
        fireEvent.click(card);

        const valueSelect = screen.getByRole('combobox');
        fireEvent.change(valueSelect, { target: { value: 'A' } });
        
        fireEvent.click(screen.getByText('Play Cards'));
      }

      // Calculate average move time
      const averageMoveTime = moveTimes.reduce((a, b) => a + b) / moveTimes.length;
      
      // Average move time should be under 50ms
      expect(averageMoveTime).toBeLessThan(50);
      
      // No single move should take more than 100ms
      expect(Math.max(...moveTimes)).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('maintains stable memory usage during long games', async () => {
      let currentState = gameService.getGameState();
      const initialMemory = process.memoryUsage().heapUsed;
      let finalMemory: number;

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={() => {}}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Simulate a long game with many moves
      for (let i = 0; i < 20; i++) {
        const card = screen.getAllByRole('button')[0];
        fireEvent.click(card);

        const valueSelect = screen.getByRole('combobox');
        fireEvent.change(valueSelect, { target: { value: 'A' } });
        
        fireEvent.click(screen.getByText('Play Cards'));
      }

      finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be less than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('cleans up resources after game completion', async () => {
      let currentState = gameService.getGameState();
      const initialMemory = process.memoryUsage().heapUsed;

      const { unmount } = render(
        <GameBoard
          gameState={currentState}
          onAction={() => {}}
          playerId="player"
        />
      );

      // Play a complete game
      currentState = {
        ...currentState,
        gameStatus: 'finished',
        winner: 'player'
      };

      // Unmount component
      unmount();

      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      
      // Memory should be close to initial state (within 1MB)
      expect(Math.abs(finalMemory - initialMemory)).toBeLessThan(1024 * 1024);
    });
  });
}); 