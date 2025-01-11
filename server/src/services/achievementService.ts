import { PersistenceService } from './persistenceService';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'WINS' | 'BLUFFS' | 'CHALLENGES' | 'STREAKS' | 'SPECIAL';
  requirement: number;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface PlayerAchievement extends Achievement {
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalBluffs: number;
  successfulBluffs: number;
  totalChallenges: number;
  successfulChallenges: number;
  bestWinStreak: number;
  perfectGames: number;  // Games won without being caught bluffing
}

export class AchievementService {
  private readonly achievements: Achievement[] = [
    // Win-based achievements
    {
      id: 'FIRST_WIN',
      name: 'First Victory',
      description: 'Win your first game',
      category: 'WINS',
      requirement: 1,
      icon: '🏆',
      rarity: 'COMMON'
    },
    {
      id: 'VETERAN',
      name: 'Veteran Player',
      description: 'Win 50 games',
      category: 'WINS',
      requirement: 50,
      icon: '👑',
      rarity: 'RARE'
    },
    {
      id: 'MASTER',
      name: 'Bluff Master',
      description: 'Win 100 games',
      category: 'WINS',
      requirement: 100,
      icon: '🌟',
      rarity: 'EPIC'
    },
    // Bluff-based achievements
    {
      id: 'SMOOTH_LIAR',
      name: 'Smooth Liar',
      description: 'Successfully bluff 10 times in a single game',
      category: 'BLUFFS',
      requirement: 10,
      icon: '🎭',
      rarity: 'RARE'
    },
    {
      id: 'PERFECT_GAME',
      name: 'Perfect Deception',
      description: 'Win a game without being caught bluffing',
      category: 'BLUFFS',
      requirement: 1,
      icon: '✨',
      rarity: 'EPIC'
    },
    // Challenge-based achievements
    {
      id: 'TRUTH_SEEKER',
      name: 'Truth Seeker',
      description: 'Successfully catch 5 bluffs in a single game',
      category: 'CHALLENGES',
      requirement: 5,
      icon: '🔍',
      rarity: 'RARE'
    },
    {
      id: 'DETECTIVE',
      name: 'Master Detective',
      description: 'Maintain a 70% challenge success rate over 20 games',
      category: 'CHALLENGES',
      requirement: 70,
      icon: '🕵️',
      rarity: 'LEGENDARY'
    },
    // Streak-based achievements
    {
      id: 'WIN_STREAK_5',
      name: 'Winning Streak',
      description: 'Win 5 games in a row',
      category: 'STREAKS',
      requirement: 5,
      icon: '🔥',
      rarity: 'RARE'
    },
    {
      id: 'WIN_STREAK_10',
      name: 'Unstoppable',
      description: 'Win 10 games in a row',
      category: 'STREAKS',
      requirement: 10,
      icon: '⚡',
      rarity: 'LEGENDARY'
    },
    // Special achievements
    {
      id: 'COMEBACK_KID',
      name: 'Comeback Kid',
      description: 'Win a game after having more than 10 cards',
      category: 'SPECIAL',
      requirement: 1,
      icon: '🔄',
      rarity: 'EPIC'
    }
  ];

  private playerAchievements: Map<string, PlayerAchievement[]> = new Map();
  private playerStats: Map<string, GameStats> = new Map();
  private readonly persistenceService: PersistenceService;

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const savedAchievements = await this.persistenceService.load('achievements');
      const savedStats = await this.persistenceService.load('achievementStats');
      
      if (savedAchievements) {
        this.playerAchievements = new Map(Object.entries(savedAchievements));
      }
      
      if (savedStats) {
        this.playerStats = new Map(Object.entries(savedStats));
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const achievementsObj = Object.fromEntries(this.playerAchievements);
      const statsObj = Object.fromEntries(this.playerStats);
      
      await this.persistenceService.save('achievements', achievementsObj);
      await this.persistenceService.save('achievementStats', statsObj);
    } catch (error) {
      console.error('Failed to save achievement data:', error);
    }
  }

  private initializePlayerData(playerId: string): void {
    if (!this.playerAchievements.has(playerId)) {
      this.playerAchievements.set(
        playerId,
        this.achievements.map(achievement => ({
          ...achievement,
          progress: 0,
          unlocked: false
        }))
      );
    }

    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        totalGames: 0,
        totalWins: 0,
        totalBluffs: 0,
        successfulBluffs: 0,
        totalChallenges: 0,
        successfulChallenges: 0,
        bestWinStreak: 0,
        perfectGames: 0
      });
    }
  }

  async updateGameStats(
    playerId: string,
    gameStats: {
      isWin: boolean;
      bluffsAttempted: number;
      bluffsSuccessful: number;
      challengesAttempted: number;
      challengesSuccessful: number;
      currentWinStreak: number;
      isPerfectGame: boolean;
      maxCards: number;
    }
  ): Promise<Achievement[]> {
    this.initializePlayerData(playerId);
    const stats = this.playerStats.get(playerId)!;
    const achievements = this.playerAchievements.get(playerId)!;
    const unlockedAchievements: Achievement[] = [];

    // Update stats
    stats.totalGames++;
    if (gameStats.isWin) stats.totalWins++;
    stats.totalBluffs += gameStats.bluffsAttempted;
    stats.successfulBluffs += gameStats.bluffsSuccessful;
    stats.totalChallenges += gameStats.challengesAttempted;
    stats.successfulChallenges += gameStats.challengesSuccessful;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, gameStats.currentWinStreak);
    if (gameStats.isPerfectGame) stats.perfectGames++;

    // Check achievements
    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let progress = 0;
      switch (achievement.id) {
        case 'FIRST_WIN':
        case 'VETERAN':
        case 'MASTER':
          progress = stats.totalWins;
          break;
        case 'SMOOTH_LIAR':
          progress = gameStats.bluffsSuccessful;
          break;
        case 'PERFECT_GAME':
          progress = stats.perfectGames;
          break;
        case 'TRUTH_SEEKER':
          progress = gameStats.challengesSuccessful;
          break;
        case 'DETECTIVE':
          progress = stats.totalChallenges >= 20 
            ? (stats.successfulChallenges / stats.totalChallenges) * 100 
            : 0;
          break;
        case 'WIN_STREAK_5':
        case 'WIN_STREAK_10':
          progress = gameStats.currentWinStreak;
          break;
        case 'COMEBACK_KID':
          progress = gameStats.isWin && gameStats.maxCards > 10 ? 1 : 0;
          break;
      }

      achievement.progress = progress;
      if (progress >= achievement.requirement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        unlockedAchievements.push(achievement);
      }
    });

    await this.saveData();
    return unlockedAchievements;
  }

  getPlayerAchievements(playerId: string): PlayerAchievement[] {
    this.initializePlayerData(playerId);
    return this.playerAchievements.get(playerId)!;
  }

  getPlayerStats(playerId: string): GameStats {
    this.initializePlayerData(playerId);
    return this.playerStats.get(playerId)!;
  }

  getAchievementProgress(playerId: string, achievementId: string): number {
    this.initializePlayerData(playerId);
    const achievement = this.playerAchievements.get(playerId)!
      .find(a => a.id === achievementId);
    return achievement ? achievement.progress : 0;
  }
} 