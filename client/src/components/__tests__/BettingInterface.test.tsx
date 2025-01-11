import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BettingInterface } from '../BettingInterface';
import { Bet } from '../../../server/src/services/bettingService';

describe('BettingInterface', () => {
  const defaultProps = {
    tournamentId: 'tournament1',
    matchId: 'match1',
    currentPlayerId: 'player3',
    player1Id: 'player1',
    player2Id: 'player2',
    onPlaceBet: jest.fn(),
  };

  const mockBet: Bet = {
    id: 'bet1',
    tournamentId: 'tournament1',
    matchId: 'match1',
    playerId: 'player3',
    amount: 100,
    predictedWinnerId: 'player1',
    timestamp: Date.now(),
    status: 'PENDING'
  };

  const mockPlayerStats = {
    betsPlaced: 10,
    betsWon: 6,
    totalWagered: 1000,
    totalWon: 1800,
    winRate: 0.6
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders betting form correctly', () => {
    render(<BettingInterface {...defaultProps} />);
    
    expect(screen.getByText('Place Your Bet')).toBeInTheDocument();
    expect(screen.getByLabelText('Bet Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Winner')).toBeInTheDocument();
    expect(screen.getByText('player1')).toBeInTheDocument();
    expect(screen.getByText('player2')).toBeInTheDocument();
  });

  it('displays player stats when provided', () => {
    render(<BettingInterface {...defaultProps} playerStats={mockPlayerStats} />);
    
    expect(screen.getByText('Total Bets')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('1800')).toBeInTheDocument();
  });

  it('displays match bets when provided', () => {
    render(<BettingInterface {...defaultProps} matchBets={[mockBet]} />);
    
    expect(screen.getByText('Match Bets')).toBeInTheDocument();
    expect(screen.getByText('100 coins')).toBeInTheDocument();
    expect(screen.getByText(/on player1/)).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('handles bet submission correctly', async () => {
    render(<BettingInterface {...defaultProps} />);
    
    // Enter bet amount
    const amountInput = screen.getByLabelText('Bet Amount');
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Select winner
    const player1Button = screen.getByText('player1');
    fireEvent.click(player1Button);

    // Submit form
    const submitButton = screen.getByText('Place Bet');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onPlaceBet).toHaveBeenCalledWith(100, 'player1');
    });
  });

  it('disables submit button when form is invalid', () => {
    render(<BettingInterface {...defaultProps} />);
    
    const submitButton = screen.getByText('Place Bet');
    expect(submitButton).toBeDisabled();

    // Enter only amount
    const amountInput = screen.getByLabelText('Bet Amount');
    fireEvent.change(amountInput, { target: { value: '100' } });
    expect(submitButton).toBeDisabled();

    // Select only winner
    fireEvent.change(amountInput, { target: { value: '' } });
    const player1Button = screen.getByText('player1');
    fireEvent.click(player1Button);
    expect(submitButton).toBeDisabled();
  });

  it('resets form after successful bet placement', async () => {
    render(<BettingInterface {...defaultProps} />);
    
    // Fill and submit form
    const amountInput = screen.getByLabelText('Bet Amount');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    const player1Button = screen.getByText('player1');
    fireEvent.click(player1Button);
    
    const submitButton = screen.getByText('Place Bet');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(amountInput).toHaveValue('');
      expect(player1Button).not.toHaveStyle({ 'border-color': '#4a5eff' });
    });
  });

  it('displays different styles for bet statuses', () => {
    const bets: Bet[] = [
      { ...mockBet, id: 'bet1', status: 'PENDING' },
      { ...mockBet, id: 'bet2', status: 'WON', payout: 180 },
      { ...mockBet, id: 'bet3', status: 'LOST' }
    ];

    render(<BettingInterface {...defaultProps} matchBets={bets} />);
    
    const pendingBet = screen.getByText('PENDING');
    const wonBet = screen.getByText('WON');
    const lostBet = screen.getByText('LOST');

    expect(pendingBet).toHaveStyle({ 'background-color': '#ffa50022' });
    expect(wonBet).toHaveStyle({ 'background-color': '#4caf5022' });
    expect(lostBet).toHaveStyle({ 'background-color': '#f4433622' });
  });

  it('shows payout for won bets', () => {
    const wonBet: Bet = {
      ...mockBet,
      status: 'WON',
      payout: 180
    };

    render(<BettingInterface {...defaultProps} matchBets={[wonBet]} />);
    expect(screen.getByText(/Won 180 coins/)).toBeInTheDocument();
  });
}); 