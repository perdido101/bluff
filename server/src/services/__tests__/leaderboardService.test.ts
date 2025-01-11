import { LeaderboardService } from '../leaderboardService';
import { PersistenceService } from '../persistenceService';

jest.mock('../persistenceService');

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    leaderboardService = new LeaderboardService(mockPersistenceService);
  });

  it('initializes with empty stats', async () => {
    const leaderboard = leaderboardService.getLeaderboard();
    expect(leaderboard).toHaveLength(0);
  });

  it('creates new player stats correctly', async () => {
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const player1Stats = leaderboardService.getPlayerStats('player1');
    expect(player1Stats).toMatchObject({
      wins: 1,
      losses: 0,
      winStreak: 1,
      totalGamesPlayed: 1,
      eloRating: expect.any(Number),
    });
  });

  it('updates ELO ratings correctly', async () => {
    // First game
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const initialWinnerRating = leaderboardService.getPlayerStats('player1')!.eloRating;
    const initialLoserRating = leaderboardService.getPlayerStats('player2')!.eloRating;

    // Second game with same winner
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const finalWinnerRating = leaderboardService.getPlayerStats('player1')!.eloRating;
    const finalLoserRating = leaderboardService.getPlayerStats('player2')!.eloRating;

    // Winner's rating should increase less in the second game
    const firstGameIncrease = initialWinnerRating - 1200; // 1200 is starting ELO
    const secondGameIncrease = finalWinnerRating - initialWinnerRating;
    expect(secondGameIncrease).toBeLessThan(firstGameIncrease);
  });

  it('maintains win streaks correctly', async () => {
    // Player1 wins first game
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    // Player1 wins second game
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    // Player2 wins third game
    await leaderboardService.updateGameResult('player2', 'player1', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const player1Stats = leaderboardService.getPlayerStats('player1')!;
    expect(player1Stats.winStreak).toBe(0);
    expect(player1Stats.bestWinStreak).toBe(2);
  });

  it('sorts leaderboard correctly', async () => {
    // Create multiple players with different stats
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    await leaderboardService.updateGameResult('player3', 'player4', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    await leaderboardService.updateGameResult('player1', 'player3', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const leaderboard = leaderboardService.getLeaderboard();
    expect(leaderboard[0].playerId).toBe('player1');
    expect(leaderboard[0].wins).toBe(2);
  });

  it('calculates rank changes correctly', async () => {
    // Initial game establishes rankings
    await leaderboardService.updateGameResult('player1', 'player2', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    // Get initial leaderboard
    const initialLeaderboard = leaderboardService.getLeaderboard();

    // Player2 beats Player1, should cause rank change
    await leaderboardService.updateGameResult('player2', 'player1', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    const updatedLeaderboard = leaderboardService.getLeaderboard();
    expect(updatedLeaderboard[0].playerId).toBe('player2');
    expect(updatedLeaderboard[0].rankChange).toBe(1);
    expect(updatedLeaderboard[1].rankChange).toBe(-1);
  });

  it('handles inactive players correctly', async () => {
    // Create an active and inactive player
    await leaderboardService.updateGameResult('active', 'inactive', {
      duration: 300,
      winnerBluffs: 2,
      winnerBluffsCaught: 1,
      loserBluffs: 1,
      loserBluffsCaught: 1,
    });

    // Manually set inactive player's lastActive to beyond threshold
    const inactiveStats = leaderboardService.getPlayerStats('inactive')!;
    inactiveStats.lastActive = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago

    const leaderboard = leaderboardService.getLeaderboard();
    expect(leaderboard.find(entry => entry.playerId === 'inactive')).toBeUndefined();
  });
}); 