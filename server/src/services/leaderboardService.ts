import { PersistenceService } from './persistenceService';

interface PlayerStats {
  playerId: string;
  username: string;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  totalGamesPlayed: number;
  bluffSuccessRate: number;
  challengeSuccessRate: number;
  averageGameDuration: number;
  rank?: number;
  eloRating: number;
  lastActive: number;
}

interface LeaderboardEntry extends PlayerStats {
  rank: number;
  rankChange: number;
}

export class LeaderboardService {
  private stats: Map<string, PlayerStats> = new Map();
  private readonly persistenceService: PersistenceService;
  private readonly K_FACTOR = 32; // ELO rating K-factor
  private readonly INACTIVITY_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
    this.loadStats();
  }

  private async loadStats(): Promise<void> {
    try {
      const savedStats = await this.persistenceService.load('leaderboard');
      if (savedStats) {
        this.stats = new Map(Object.entries(savedStats));
      }
    } catch (error) {
      console.error('Failed to load leaderboard stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      const statsObj = Object.fromEntries(this.stats);
      await this.persistenceService.save('leaderboard', statsObj);
    } catch (error) {
      console.error('Failed to save leaderboard stats:', error);
    }
  }

  private calculateEloRating(winner: PlayerStats, loser: PlayerStats): { winnerNewRating: number; loserNewRating: number } {
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.eloRating - winner.eloRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.eloRating - loser.eloRating) / 400));

    const winnerNewRating = winner.eloRating + this.K_FACTOR * (1 - expectedWinner);
    const loserNewRating = loser.eloRating + this.K_FACTOR * (0 - expectedLoser);

    return { winnerNewRating, loserNewRating };
  }

  async updateGameResult(
    winnerId: string,
    loserId: string,
    gameStats: {
      duration: number;
      winnerBluffs: number;
      winnerBluffsCaught: number;
      loserBluffs: number;
      loserBluffsCaught: number;
    }
  ): Promise<void> {
    let winner = this.stats.get(winnerId) || this.createNewPlayerStats(winnerId);
    let loser = this.stats.get(loserId) || this.createNewPlayerStats(loserId);

    // Update ELO ratings
    const { winnerNewRating, loserNewRating } = this.calculateEloRating(winner, loser);
    winner.eloRating = winnerNewRating;
    loser.eloRating = loserNewRating;

    // Update winner stats
    winner.wins++;
    winner.winStreak++;
    winner.bestWinStreak = Math.max(winner.winStreak, winner.bestWinStreak);
    winner.totalGamesPlayed++;
    winner.bluffSuccessRate = this.updateSuccessRate(
      winner.bluffSuccessRate,
      gameStats.winnerBluffs,
      gameStats.winnerBluffsCaught
    );
    winner.lastActive = Date.now();

    // Update loser stats
    loser.losses++;
    loser.winStreak = 0;
    loser.totalGamesPlayed++;
    loser.bluffSuccessRate = this.updateSuccessRate(
      loser.bluffSuccessRate,
      gameStats.loserBluffs,
      gameStats.loserBluffsCaught
    );
    loser.lastActive = Date.now();

    // Update average game duration
    winner.averageGameDuration = this.updateAverage(
      winner.averageGameDuration,
      gameStats.duration,
      winner.totalGamesPlayed
    );
    loser.averageGameDuration = this.updateAverage(
      loser.averageGameDuration,
      gameStats.duration,
      loser.totalGamesPlayed
    );

    this.stats.set(winnerId, winner);
    this.stats.set(loserId, loser);

    await this.saveStats();
  }

  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    const now = Date.now();
    const activeStats = Array.from(this.stats.values())
      .filter(stats => now - stats.lastActive < this.INACTIVITY_THRESHOLD);

    const sortedStats = activeStats.sort((a, b) => {
      if (b.eloRating !== a.eloRating) return b.eloRating - a.eloRating;
      if (b.winStreak !== a.winStreak) return b.winStreak - a.winStreak;
      return b.wins / (b.wins + b.losses) - a.wins / (a.wins + a.losses);
    });

    return sortedStats.slice(0, limit).map((stats, index) => {
      const rankChange = (stats.rank ?? 0) - (index + 1);
      stats.rank = index + 1;
      return { ...stats, rank: index + 1, rankChange };
    });
  }

  getPlayerStats(playerId: string): PlayerStats | undefined {
    return this.stats.get(playerId);
  }

  private createNewPlayerStats(playerId: string): PlayerStats {
    return {
      playerId,
      username: `Player_${playerId.slice(0, 6)}`,
      wins: 0,
      losses: 0,
      winStreak: 0,
      bestWinStreak: 0,
      totalGamesPlayed: 0,
      bluffSuccessRate: 0,
      challengeSuccessRate: 0,
      averageGameDuration: 0,
      eloRating: 1200, // Starting ELO rating
      lastActive: Date.now()
    };
  }

  private updateSuccessRate(currentRate: number, attempts: number, successes: number): number {
    if (attempts === 0) return currentRate;
    return (currentRate * 0.7 + (successes / attempts) * 0.3) * 100;
  }

  private updateAverage(currentAvg: number, newValue: number, totalCount: number): number {
    return (currentAvg * (totalCount - 1) + newValue) / totalCount;
  }

  async updatePlayerUsername(playerId: string, username: string): Promise<void> {
    const stats = this.stats.get(playerId);
    if (stats) {
      stats.username = username;
      await this.saveStats();
    }
  }

  getPlayerRank(playerId: string): number | undefined {
    const leaderboard = this.getLeaderboard(Infinity);
    const entry = leaderboard.find(entry => entry.playerId === playerId);
    return entry?.rank;
  }
} 