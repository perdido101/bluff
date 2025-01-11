interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  successfulBluffs: number;
  successfulChallenges: number;
  averageCardsPerTurn: number;
}

const STATS_KEY = 'bluff_game_stats';

export const statisticsService = {
  getStats(): GameStats {
    const saved = localStorage.getItem(STATS_KEY);
    return saved ? JSON.parse(saved) : {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      successfulBluffs: 0,
      successfulChallenges: 0,
      averageCardsPerTurn: 0
    };
  },

  updateStats(update: Partial<GameStats>) {
    const current = this.getStats();
    const updated = { ...current, ...update };
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    return updated;
  },

  recordGame(won: boolean) {
    const stats = this.getStats();
    this.updateStats({
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (won ? 1 : 0),
      losses: stats.losses + (won ? 0 : 1)
    });
  },

  recordBluff(successful: boolean) {
    const stats = this.getStats();
    if (successful) {
      this.updateStats({
        successfulBluffs: stats.successfulBluffs + 1
      });
    }
  },

  recordChallenge(successful: boolean) {
    const stats = this.getStats();
    if (successful) {
      this.updateStats({
        successfulChallenges: stats.successfulChallenges + 1
      });
    }
  }
}; 