import { AchievementService } from '../achievementService';
import { PersistenceService } from '../persistenceService';

jest.mock('../persistenceService');

describe('AchievementService', () => {
  let achievementService: AchievementService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    achievementService = new AchievementService(mockPersistenceService);
  });

  it('initializes player data correctly', () => {
    const achievements = achievementService.getPlayerAchievements('player1');
    const stats = achievementService.getPlayerStats('player1');

    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].progress).toBe(0);
    expect(achievements[0].unlocked).toBe(false);

    expect(stats.totalGames).toBe(0);
    expect(stats.totalWins).toBe(0);
    expect(stats.totalBluffs).toBe(0);
  });

  it('unlocks first win achievement', async () => {
    const unlockedAchievements = await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 2,
      bluffsSuccessful: 1,
      challengesAttempted: 3,
      challengesSuccessful: 2,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    expect(unlockedAchievements).toHaveLength(1);
    expect(unlockedAchievements[0].id).toBe('FIRST_WIN');
    expect(unlockedAchievements[0].unlocked).toBe(true);
  });

  it('tracks win streaks correctly', async () => {
    // First win
    await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 0,
      bluffsSuccessful: 0,
      challengesAttempted: 0,
      challengesSuccessful: 0,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    // Second win
    await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 0,
      bluffsSuccessful: 0,
      challengesAttempted: 0,
      challengesSuccessful: 0,
      currentWinStreak: 2,
      isPerfectGame: false,
      maxCards: 5
    });

    const stats = achievementService.getPlayerStats('player1');
    expect(stats.totalWins).toBe(2);
    expect(stats.bestWinStreak).toBe(2);
  });

  it('unlocks perfect game achievement', async () => {
    const unlockedAchievements = await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 5,
      bluffsSuccessful: 5,
      challengesAttempted: 2,
      challengesSuccessful: 2,
      currentWinStreak: 1,
      isPerfectGame: true,
      maxCards: 5
    });

    expect(unlockedAchievements.find(a => a.id === 'PERFECT_GAME')).toBeTruthy();
  });

  it('unlocks smooth liar achievement', async () => {
    const unlockedAchievements = await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 12,
      bluffsSuccessful: 10,
      challengesAttempted: 2,
      challengesSuccessful: 1,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    expect(unlockedAchievements.find(a => a.id === 'SMOOTH_LIAR')).toBeTruthy();
  });

  it('unlocks truth seeker achievement', async () => {
    const unlockedAchievements = await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 2,
      bluffsSuccessful: 1,
      challengesAttempted: 6,
      challengesSuccessful: 5,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    expect(unlockedAchievements.find(a => a.id === 'TRUTH_SEEKER')).toBeTruthy();
  });

  it('unlocks comeback kid achievement', async () => {
    const unlockedAchievements = await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 2,
      bluffsSuccessful: 1,
      challengesAttempted: 3,
      challengesSuccessful: 2,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 12
    });

    expect(unlockedAchievements.find(a => a.id === 'COMEBACK_KID')).toBeTruthy();
  });

  it('tracks detective achievement progress correctly', async () => {
    // Play 20 games with high challenge success rate
    for (let i = 0; i < 20; i++) {
      await achievementService.updateGameStats('player1', {
        isWin: true,
        bluffsAttempted: 1,
        bluffsSuccessful: 1,
        challengesAttempted: 5,
        challengesSuccessful: 4, // 80% success rate
        currentWinStreak: 1,
        isPerfectGame: false,
        maxCards: 5
      });
    }

    const achievements = achievementService.getPlayerAchievements('player1');
    const detective = achievements.find(a => a.id === 'DETECTIVE');
    expect(detective?.unlocked).toBe(true);
  });

  it('persists achievement data', async () => {
    await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 2,
      bluffsSuccessful: 1,
      challengesAttempted: 3,
      challengesSuccessful: 2,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    expect(mockPersistenceService.save).toHaveBeenCalledWith('achievements', expect.any(Object));
    expect(mockPersistenceService.save).toHaveBeenCalledWith('achievementStats', expect.any(Object));
  });

  it('retrieves achievement progress correctly', async () => {
    await achievementService.updateGameStats('player1', {
      isWin: true,
      bluffsAttempted: 2,
      bluffsSuccessful: 1,
      challengesAttempted: 3,
      challengesSuccessful: 2,
      currentWinStreak: 1,
      isPerfectGame: false,
      maxCards: 5
    });

    const progress = achievementService.getAchievementProgress('player1', 'FIRST_WIN');
    expect(progress).toBe(1);
  });
}); 