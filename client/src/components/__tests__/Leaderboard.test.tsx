import React from 'react';
import { render, screen } from '@testing-library/react';
import { Leaderboard } from '../Leaderboard';
import '@testing-library/jest-dom';

const mockEntries = [
  {
    rank: 1,
    rankChange: 1,
    playerId: 'player1',
    username: 'Winner',
    wins: 10,
    losses: 2,
    winStreak: 3,
    bestWinStreak: 5,
    bluffSuccessRate: 75.5,
    eloRating: 1500,
  },
  {
    rank: 2,
    rankChange: -1,
    playerId: 'player2',
    username: 'Runner-up',
    wins: 8,
    losses: 4,
    winStreak: 0,
    bestWinStreak: 3,
    bluffSuccessRate: 60.0,
    eloRating: 1400,
  },
  {
    rank: 3,
    rankChange: 0,
    playerId: 'player3',
    username: 'Newcomer',
    wins: 2,
    losses: 8,
    winStreak: 1,
    bestWinStreak: 1,
    bluffSuccessRate: 40.0,
    eloRating: 1100,
  },
] as const;

describe('Leaderboard', () => {
  it('renders all entries with correct data', () => {
    render(<Leaderboard entries={mockEntries} />);

    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Runner-up')).toBeInTheDocument();
    expect(screen.getByText('Newcomer')).toBeInTheDocument();

    // Check ranks
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Check stats
    expect(screen.getByText('10/2')).toBeInTheDocument();
    expect(screen.getByText('8/4')).toBeInTheDocument();
    expect(screen.getByText('2/8')).toBeInTheDocument();
  });

  it('highlights current player row', () => {
    render(<Leaderboard entries={mockEntries} currentPlayerId="player2" />);

    const rows = screen.getAllByRole('row');
    expect(rows[2]).toHaveStyle({ background: expect.stringContaining('2a3aff') });
  });

  it('displays rank changes with correct indicators', () => {
    render(<Leaderboard entries={mockEntries} />);

    const rankChanges = screen.getAllByText(/[0-9]/);
    
    // First player moved up
    expect(rankChanges[0].parentElement).toHaveStyle({ color: '#4caf50' });
    
    // Second player moved down
    expect(rankChanges[1].parentElement).toHaveStyle({ color: '#f44336' });
  });

  it('calculates and displays win rates correctly', () => {
    render(<Leaderboard entries={mockEntries} />);

    // Winner: 10 wins, 2 losses = 83.3%
    expect(screen.getByText('83.3%')).toHaveStyle({ color: '#4caf50' });

    // Runner-up: 8 wins, 4 losses = 66.7%
    expect(screen.getByText('66.7%')).toHaveStyle({ color: '#4caf50' });

    // Newcomer: 2 wins, 8 losses = 20.0%
    expect(screen.getByText('20.0%')).toHaveStyle({ color: '#f44336' });
  });

  it('displays bluff success rates correctly', () => {
    render(<Leaderboard entries={mockEntries} />);

    expect(screen.getByText('75.5%')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('displays ELO ratings correctly', () => {
    render(<Leaderboard entries={mockEntries} />);

    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('1400')).toBeInTheDocument();
    expect(screen.getByText('1100')).toBeInTheDocument();
  });

  it('displays win streaks and best streaks correctly', () => {
    render(<Leaderboard entries={mockEntries} />);

    // Current streaks
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Best streaks
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles empty entries gracefully', () => {
    render(<Leaderboard entries={[]} />);

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });
}); 