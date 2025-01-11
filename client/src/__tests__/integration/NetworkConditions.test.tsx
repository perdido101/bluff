import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { GameBoard } from '../../components/GameBoard/GameBoard';
import { GameService } from '../../services/GameService';

// Mock fetch for network requests
const originalFetch = global.fetch;

describe('Network Conditions Integration', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  describe('Connection Issues', () => {
    it('handles slow network connections', async () => {
      // Simulate slow network
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(gameService.getGameState())
            });
          }, 2000); // 2-second delay
        })
      );

      let currentState = gameService.getGameState();

      render(
        <GameBoard
          gameState={currentState}
          onAction={async (action) => {
            // Show loading state while waiting
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
            
            await act(async () => {
              const response = await fetch('/api/move');
              currentState = await response.json();
            });

            // Loading state should be removed
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          }}
          playerId="player"
        />
      );

      // Make a move
      const firstCard = screen.getAllByRole('button')[0];
      fireEvent.click(firstCard);

      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });
      
      // Verify loading state appears
      fireEvent.click(screen.getByText('Play Cards'));
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('handles network timeouts gracefully', async () => {
      // Simulate network timeout
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Network timeout'));
          }, 5000);
        })
      );

      let currentState = gameService.getGameState();
      let errorShown = false;

      render(
        <GameBoard
          gameState={currentState}
          onAction={async (action) => {
            try {
              await act(async () => {
                await fetch('/api/move');
              });
            } catch (error) {
              errorShown = true;
              // Verify error message is shown
              expect(screen.getByText(/network error/i)).toBeInTheDocument();
            }
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

      // Verify error handling
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5500));
      });
      expect(errorShown).toBe(true);
    });

    it('retries failed requests automatically', async () => {
      let attemptCount = 0;
      
      // Simulate failed request that succeeds on retry
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => {
          attemptCount++;
          if (attemptCount === 1) {
            reject(new Error('Network error'));
          } else {
            resolve({
              ok: true,
              json: () => Promise.resolve(gameService.getGameState())
            });
          }
        })
      );

      let currentState = gameService.getGameState();

      render(
        <GameBoard
          gameState={currentState}
          onAction={async (action) => {
            await act(async () => {
              try {
                const response = await fetch('/api/move');
                currentState = await response.json();
              } catch (error) {
                // Retry once
                const response = await fetch('/api/move');
                currentState = await response.json();
              }
            });
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

      // Verify request was retried
      expect(attemptCount).toBe(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('maintains game state during connection loss', async () => {
      let currentState = gameService.getGameState();
      const initialHandSize = currentState.players[0].hand.length;

      // Simulate connection loss after move
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject(new Error('No connection'))
      );

      render(
        <GameBoard
          gameState={currentState}
          onAction={async (action) => {
            try {
              await fetch('/api/move');
            } catch (error) {
              // Connection lost, but state should be preserved
              expect(currentState.players[0].hand).toHaveLength(initialHandSize);
              expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
            }
          }}
          playerId="player"
        />
      );

      // Select and try to play a card
      const firstCard = screen.getAllByRole('button')[0];
      fireEvent.click(firstCard);
      
      // Verify state is maintained
      expect(firstCard.closest('div')).toHaveStyle({ background: '#e3f2fd' });
    });
  });
}); 