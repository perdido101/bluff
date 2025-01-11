import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard';
import { GameState, GameAction } from '../../types/game';

describe('GameBoard Component', () => {
  // Mock game state that we'll reuse across tests
  const mockGameState: GameState = {
    players: [
      {
        id: 'player',
        hand: [
          { suit: 'hearts', value: 'A' },
          { suit: 'diamonds', value: 'K' }
        ],
        isAI: false
      },
      {
        id: 'ai',
        hand: [
          { suit: 'clubs', value: 'Q' },
          { suit: 'spades', value: 'J' }
        ],
        isAI: true
      }
    ],
    currentPlayer: 'player',
    pile: [],
    lastMove: null,
    gameStatus: 'playing',
    winner: null
  };

  // Mock callback for actions
  const mockOnAction = jest.fn();

  beforeEach(() => {
    // Clear mock function calls before each test
    mockOnAction.mockClear();
  });

  describe('Initial Rendering', () => {
    it('renders player and opponent hands', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Player's cards should be visible
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();

      // Opponent's cards should be face down (no visible values)
      expect(screen.queryByText('Q')).not.toBeInTheDocument();
      expect(screen.queryByText('J')).not.toBeInTheDocument();
    });

    it('renders action buttons when it is player\'s turn', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      expect(screen.getByText('Play Cards')).toBeInTheDocument();
      expect(screen.getByText('Challenge')).toBeInTheDocument();
      expect(screen.getByText('Pass')).toBeInTheDocument();
    });

    it('disables action buttons when it is not player\'s turn', () => {
      const notPlayerTurnState = {
        ...mockGameState,
        currentPlayer: 'ai'
      };

      render(
        <GameBoard
          gameState={notPlayerTurnState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      expect(screen.getByText('Play Cards')).toBeDisabled();
      expect(screen.getByText('Challenge')).toBeDisabled();
      expect(screen.getByText('Pass')).toBeDisabled();
    });
  });

  describe('Game Information Display', () => {
    it('shows last move information when available', () => {
      const stateWithLastMove = {
        ...mockGameState,
        lastMove: {
          playerId: 'ai',
          declaredValue: 'K',
          numberOfCards: 2
        }
      };

      render(
        <GameBoard
          gameState={stateWithLastMove}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      expect(screen.getByText('Last move: 2 K(s)')).toBeInTheDocument();
    });
  });

  describe('Player Interactions', () => {
    it('allows card selection and playing cards', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Select a card
      fireEvent.click(screen.getByText('A'));

      // Select a value from dropdown
      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });

      // Click play button
      fireEvent.click(screen.getByText('Play Cards'));

      // Verify the action was called with correct parameters
      expect(mockOnAction).toHaveBeenCalledWith({
        type: 'PLAY_CARDS',
        playerId: 'player',
        payload: {
          cards: [mockGameState.players[0].hand[0]],
          declaredValue: 'A'
        }
      });
    });

    it('handles passing turn', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      fireEvent.click(screen.getByText('Pass'));

      expect(mockOnAction).toHaveBeenCalledWith({
        type: 'PASS',
        playerId: 'player'
      });
    });

    it('handles challenging', () => {
      const stateWithLastMove = {
        ...mockGameState,
        lastMove: {
          playerId: 'ai',
          declaredValue: 'K',
          numberOfCards: 2
        }
      };

      render(
        <GameBoard
          gameState={stateWithLastMove}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      fireEvent.click(screen.getByText('Challenge'));

      expect(mockOnAction).toHaveBeenCalledWith({
        type: 'CHALLENGE',
        playerId: 'player'
      });
    });

    it('prevents playing cards without selecting a declared value', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Select a card
      fireEvent.click(screen.getByText('A'));

      // Try to play without selecting a value
      const playButton = screen.getByText('Play Cards');
      expect(playButton).toBeDisabled();
    });

    it('prevents playing cards without selecting any cards', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Select a value but no cards
      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });

      // Try to play
      const playButton = screen.getByText('Play Cards');
      expect(playButton).toBeDisabled();
    });

    it('prevents challenging when there is no last move', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      const challengeButton = screen.getByText('Challenge');
      expect(challengeButton).toBeDisabled();
    });
  });

  describe('Game State Changes', () => {
    it('updates display when turn changes', () => {
      // First render with player's turn
      const { rerender } = render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify it's player's turn (buttons enabled)
      expect(screen.getByText('Play Cards')).not.toBeDisabled();

      // Update state to AI's turn
      const aiTurnState = {
        ...mockGameState,
        currentPlayer: 'ai'
      };

      // Re-render with new state
      rerender(
        <GameBoard
          gameState={aiTurnState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify buttons are now disabled
      expect(screen.getByText('Play Cards')).toBeDisabled();
    });

    it('updates pile display when cards are played', () => {
      // Start with some cards in the pile
      const stateWithPile = {
        ...mockGameState,
        pile: [
          { suit: 'hearts', value: 'K' },
          { suit: 'diamonds', value: 'K' }
        ],
        lastMove: {
          playerId: 'ai',
          declaredValue: 'K',
          numberOfCards: 2
        }
      };

      render(
        <GameBoard
          gameState={stateWithPile}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify pile information is displayed
      expect(screen.getByText('Last move: 2 K(s)')).toBeInTheDocument();
    });

    it('clears selected cards after playing', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Select a card
      fireEvent.click(screen.getByText('A'));
      
      // Select a value and play
      const valueSelect = screen.getByRole('combobox');
      fireEvent.change(valueSelect, { target: { value: 'A' } });
      fireEvent.click(screen.getByText('Play Cards'));

      // Verify the card is no longer selected (check for non-selected style)
      const cardElement = screen.getByText('A').closest('div');
      expect(cardElement).not.toHaveStyle({ background: '#e3f2fd' });
    });

    it('updates hand display when receiving cards', () => {
      // Start with initial state
      const { rerender } = render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Update state with new cards in hand
      const stateWithNewCards = {
        ...mockGameState,
        players: [
          {
            ...mockGameState.players[0],
            hand: [
              ...mockGameState.players[0].hand,
              { suit: 'spades', value: '2' },
              { suit: 'clubs', value: '3' }
            ]
          },
          mockGameState.players[1]
        ]
      };

      // Re-render with new state
      rerender(
        <GameBoard
          gameState={stateWithNewCards}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify new cards are displayed
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('maintains game state during opponent\'s turn', () => {
      // Start with player's turn
      const { rerender } = render(
        <GameBoard
          gameState={mockGameState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Select a card before turn changes
      fireEvent.click(screen.getByText('A'));

      // Change to opponent's turn
      const opponentTurnState = {
        ...mockGameState,
        currentPlayer: 'ai'
      };

      rerender(
        <GameBoard
          gameState={opponentTurnState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify selected card is still visible but interaction is disabled
      const cardElement = screen.getByText('A').closest('div');
      expect(cardElement).toHaveStyle({ background: '#e3f2fd' });
      expect(screen.getByText('Play Cards')).toBeDisabled();
    });
  });

  describe('End Game Scenarios', () => {
    it('displays winner message when game is finished with player win', () => {
      const winningState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'player',
        players: [
          {
            ...mockGameState.players[0],
            hand: [] // Empty hand indicates win
          },
          mockGameState.players[1]
        ]
      };

      render(
        <GameBoard
          gameState={winningState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify winner message is displayed
      expect(screen.getByText(/You win!/i)).toBeInTheDocument();
      // Verify game controls are disabled
      expect(screen.getByText('Play Cards')).toBeDisabled();
      expect(screen.getByText('Challenge')).toBeDisabled();
      expect(screen.getByText('Pass')).toBeDisabled();
    });

    it('displays loss message when AI wins', () => {
      const losingState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'ai',
        players: [
          mockGameState.players[0],
          {
            ...mockGameState.players[1],
            hand: [] // Empty hand indicates win
          }
        ]
      };

      render(
        <GameBoard
          gameState={losingState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify loss message is displayed
      expect(screen.getByText(/AI wins!/i)).toBeInTheDocument();
      // Verify game controls are disabled
      expect(screen.getByText('Play Cards')).toBeDisabled();
      expect(screen.getByText('Challenge')).toBeDisabled();
      expect(screen.getByText('Pass')).toBeDisabled();
    });

    it('shows final hands when game ends', () => {
      const finalState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'ai',
        // AI's hand should now be visible
        players: [
          {
            ...mockGameState.players[0],
            hand: [
              { suit: 'hearts', value: '2' },
              { suit: 'diamonds', value: '3' }
            ]
          },
          {
            ...mockGameState.players[1],
            hand: [] // Winning empty hand
          }
        ]
      };

      render(
        <GameBoard
          gameState={finalState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify player's final hand is visible
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('disables all interactions after game ends', () => {
      const endedState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'ai'
      };

      render(
        <GameBoard
          gameState={endedState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Try to interact with cards
      fireEvent.click(screen.getByText('A'));

      // Verify no actions were triggered
      expect(mockOnAction).not.toHaveBeenCalled();

      // Verify all controls are disabled
      expect(screen.getByText('Play Cards')).toBeDisabled();
      expect(screen.getByText('Challenge')).toBeDisabled();
      expect(screen.getByText('Pass')).toBeDisabled();
    });

    it('shows play again option when game ends', () => {
      const endedState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'player'
      };

      render(
        <GameBoard
          gameState={endedState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify play again button is present
      const playAgainButton = screen.getByText(/play again/i);
      expect(playAgainButton).toBeInTheDocument();
      expect(playAgainButton).not.toBeDisabled();

      // Click play again
      fireEvent.click(playAgainButton);

      // Verify reset action was triggered
      expect(mockOnAction).toHaveBeenCalledWith({
        type: 'RESET_GAME',
        playerId: 'player'
      });
    });

    it('displays game statistics at the end', () => {
      const endedState = {
        ...mockGameState,
        gameStatus: 'finished',
        winner: 'player',
        statistics: {
          totalMoves: 15,
          successfulBluffs: 3,
          successfulChallenges: 2
        }
      };

      render(
        <GameBoard
          gameState={endedState}
          onAction={mockOnAction}
          playerId="player"
        />
      );

      // Verify statistics are displayed
      expect(screen.getByText(/total moves: 15/i)).toBeInTheDocument();
      expect(screen.getByText(/successful bluffs: 3/i)).toBeInTheDocument();
      expect(screen.getByText(/successful challenges: 2/i)).toBeInTheDocument();
    });
  });
}); 