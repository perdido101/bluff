import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { GameBoard } from '../../components/GameBoard/GameBoard';
import { GameService } from '../../services/GameService';
import { AIPlayer } from '../../services/AIPlayer';

describe('Game Flow Integration', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  describe('Game Initialization', () => {
    it('sets up initial game state correctly', () => {
      const initialState = gameService.getGameState();
      
      render(
        <GameBoard
          gameState={initialState}
          onAction={(action) => {
            const newState = gameService.makeMove(action);
            // Re-render with new state would happen here in real app
          }}
          playerId="player"
        />
      );

      // Verify initial setup
      expect(screen.getAllByRole('button')).toHaveLength(26); // 26 cards in player's hand
      expect(screen.getByText('Play Cards')).toBeInTheDocument();
      expect(screen.getByText('Challenge')).toBeDisabled(); // No moves to challenge yet
    });
  });

  describe('Basic Game Flow', () => {
    it('handles a complete turn cycle', () => {
      const initialState = gameService.getGameState();
      let currentState = initialState;

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={(action) => {
                  currentState = gameService.makeMove(action);
                  rerender;
                }}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Player selects and plays a card
      const firstCard = screen.getAllByRole('button')[0]; // First card in hand
      fireEvent.click(firstCard);

      // Select a value
      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });

      // Play the cards
      fireEvent.click(screen.getByText('Play Cards'));

      // Verify turn switched to AI
      expect(currentState.currentPlayer).toBe('ai');
      expect(screen.getByText('Play Cards')).toBeDisabled();

      // AI should have made its move automatically
      expect(currentState.currentPlayer).toBe('player');
      expect(screen.getByText('Play Cards')).not.toBeDisabled();
    });
  });

  describe('Challenge Mechanics', () => {
    it('handles a successful challenge', () => {
      let currentState = gameService.getGameState();
      
      // Modify state to simulate AI's last move (a bluff)
      currentState = {
        ...currentState,
        lastMove: {
          playerId: 'ai',
          declaredValue: 'K',
          numberOfCards: 1
        },
        pile: [{ suit: 'hearts', value: '2' }] // Actual card different from declared
      };

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={(action) => {
                  currentState = gameService.makeMove(action);
                  rerender;
                }}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Player challenges
      fireEvent.click(screen.getByText('Challenge'));

      // Verify AI picked up the pile (was caught bluffing)
      expect(currentState.pile).toHaveLength(0);
      expect(currentState.players[1].hand).toContainEqual({ suit: 'hearts', value: '2' });
    });
  });

  describe('State Management', () => {
    it('maintains consistent state across multiple moves', () => {
      let currentState = gameService.getGameState();
      const initialHandSize = currentState.players[0].hand.length;

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={(action) => {
                  currentState = gameService.makeMove(action);
                  rerender;
                }}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Make several moves
      for (let i = 0; i < 3; i++) {
        // Player plays a card
        const firstCard = screen.getAllByRole('button')[0];
        fireEvent.click(firstCard);

        const valueSelect = screen.getByRole('combobox');
        fireEvent.change(valueSelect, { target: { value: 'A' } });
        fireEvent.click(screen.getByText('Play Cards'));

        // Verify hand size decreases
        expect(currentState.players[0].hand).toHaveLength(initialHandSize - (i + 1));
      }
    });
  });

  describe('Error Handling', () => {
    it('handles invalid moves gracefully', () => {
      let currentState = gameService.getGameState();
      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            try {
              currentState = gameService.makeMove(action);
              rerender(
                <GameBoard
                  gameState={currentState}
                  onAction={(action) => {
                    currentState = gameService.makeMove(action);
                    rerender;
                  }}
                  playerId="player"
                />
              );
            } catch (error) {
              // Error should be handled by the UI
              expect(error.message).toBe('Invalid move');
            }
          }}
          playerId="player"
        />
      );

      // Try to play without selecting cards
      fireEvent.click(screen.getByText('Play Cards'));
      
      // State should remain unchanged
      expect(currentState.players[0].hand).toHaveLength(26);
    });

    it('prevents playing out of turn', async () => {
      let currentState = {
        ...gameService.getGameState(),
        currentPlayer: 'ai'
      };

      render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
          }}
          playerId="player"
        />
      );

      // Try to play during AI's turn
      const firstCard = screen.getAllByRole('button')[0];
      fireEvent.click(firstCard);

      // Verify controls are disabled
      expect(screen.getByText('Play Cards')).toBeDisabled();
      expect(screen.getByText('Challenge')).toBeDisabled();
      expect(screen.getByText('Pass')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles last card scenarios correctly', () => {
      let currentState = gameService.getGameState();
      // Modify state to leave player with one card
      currentState.players[0].hand = [currentState.players[0].hand[0]];

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={(action) => {
                  currentState = gameService.makeMove(action);
                  rerender;
                }}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Play the last card
      const lastCard = screen.getAllByRole('button')[0];
      fireEvent.click(lastCard);

      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });
      fireEvent.click(screen.getByText('Play Cards'));

      // Verify game ends
      expect(currentState.gameStatus).toBe('finished');
      expect(currentState.winner).toBe('player');
    });

    it('handles simultaneous actions correctly', async () => {
      let currentState = gameService.getGameState();
      let actionCount = 0;

      const { rerender } = render(
        <GameBoard
          gameState={currentState}
          onAction={(action) => {
            actionCount++;
            currentState = gameService.makeMove(action);
            rerender(
              <GameBoard
                gameState={currentState}
                onAction={(action) => {
                  currentState = gameService.makeMove(action);
                  rerender;
                }}
                playerId="player"
              />
            );
          }}
          playerId="player"
        />
      );

      // Rapidly click multiple cards
      const cards = screen.getAllByRole('button').slice(0, 3);
      cards.forEach(card => {
        fireEvent.click(card);
      });

      // Verify only appropriate number of cards are selected
      const selectedCards = screen.getAllByRole('button').filter(
        button => button.closest('div')?.style.background === 'rgb(227, 242, 253)'
      );
      expect(selectedCards.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Game Recovery', () => {
    it('can resume from a saved state', () => {
      // Simulate a saved game state
      const savedState = {
        ...gameService.getGameState(),
        currentPlayer: 'player',
        pile: [{ suit: 'hearts', value: 'K' }],
        lastMove: {
          playerId: 'ai',
          declaredValue: 'K',
          numberOfCards: 1
        }
      };

      render(
        <GameBoard
          gameState={savedState}
          onAction={(action) => {
            const newState = gameService.makeMove(action);
            // Re-render would happen here
          }}
          playerId="player"
        />
      );

      // Verify game restored correctly
      expect(screen.getByText('Last move: 1 K(s)')).toBeInTheDocument();
      expect(screen.getByText('Play Cards')).not.toBeDisabled();
    });
  });
}); 