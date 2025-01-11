import { PersistenceService } from './persistenceService';

export interface Bet {
  id: string;
  tournamentId: string;
  matchId: string;
  playerId: string;
  amount: number;
  predictedWinnerId: string;
  timestamp: number;
  status: 'PENDING' | 'WON' | 'LOST';
  payout?: number;
}

export interface BettingStats {
  totalBets: number;
  totalWagered: number;
  totalPayout: number;
  playerStats: Map<string, {
    betsPlaced: number;
    betsWon: number;
    totalWagered: number;
    totalWon: number;
    winRate: number;
  }>;
}

export class BettingService {
  private bets: Map<string, Bet> = new Map();
  private bettingStats: Map<string, BettingStats> = new Map(); // Key: tournamentId
  private readonly persistenceService: PersistenceService;

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const savedBets = await this.persistenceService.load('bets');
      const savedStats = await this.persistenceService.load('bettingStats');
      
      if (savedBets) {
        this.bets = new Map(Object.entries(savedBets));
      }
      
      if (savedStats) {
        this.bettingStats = new Map(Object.entries(savedStats));
      }
    } catch (error) {
      console.error('Failed to load betting data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const betsObj = Object.fromEntries(this.bets);
      const statsObj = Object.fromEntries(this.bettingStats);
      
      await this.persistenceService.save('bets', betsObj);
      await this.persistenceService.save('bettingStats', statsObj);
    } catch (error) {
      console.error('Failed to save betting data:', error);
    }
  }

  async placeBet(
    tournamentId: string,
    matchId: string,
    playerId: string,
    amount: number,
    predictedWinnerId: string
  ): Promise<Bet> {
    if (amount <= 0) throw new Error('Bet amount must be positive');

    const bet: Bet = {
      id: `bet_${Date.now()}_${playerId}`,
      tournamentId,
      matchId,
      playerId,
      amount,
      predictedWinnerId,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    this.bets.set(bet.id, bet);
    this.updateBettingStats(tournamentId, bet);
    await this.saveData();
    return bet;
  }

  private updateBettingStats(tournamentId: string, bet: Bet): void {
    let stats = this.bettingStats.get(tournamentId);
    if (!stats) {
      stats = {
        totalBets: 0,
        totalWagered: 0,
        totalPayout: 0,
        playerStats: new Map()
      };
      this.bettingStats.set(tournamentId, stats);
    }

    stats.totalBets++;
    stats.totalWagered += bet.amount;

    let playerStats = stats.playerStats.get(bet.playerId);
    if (!playerStats) {
      playerStats = {
        betsPlaced: 0,
        betsWon: 0,
        totalWagered: 0,
        totalWon: 0,
        winRate: 0
      };
    }

    playerStats.betsPlaced++;
    playerStats.totalWagered += bet.amount;
    playerStats.winRate = playerStats.betsWon / playerStats.betsPlaced;
    stats.playerStats.set(bet.playerId, playerStats);
  }

  async resolveBet(betId: string, actualWinnerId: string): Promise<Bet> {
    const bet = this.bets.get(betId);
    if (!bet) throw new Error('Bet not found');
    if (bet.status !== 'PENDING') throw new Error('Bet already resolved');

    const won = bet.predictedWinnerId === actualWinnerId;
    bet.status = won ? 'WON' : 'LOST';
    
    if (won) {
      // Calculate payout with 1.8x multiplier for winning bets
      bet.payout = bet.amount * 1.8;
      
      // Update stats for winning bet
      const stats = this.bettingStats.get(bet.tournamentId)!;
      stats.totalPayout += bet.payout;
      
      const playerStats = stats.playerStats.get(bet.playerId)!;
      playerStats.betsWon++;
      playerStats.totalWon += bet.payout;
      playerStats.winRate = playerStats.betsWon / playerStats.betsPlaced;
    }

    await this.saveData();
    return bet;
  }

  getBet(betId: string): Bet | undefined {
    return this.bets.get(betId);
  }

  getMatchBets(matchId: string): Bet[] {
    return Array.from(this.bets.values())
      .filter(bet => bet.matchId === matchId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getPlayerBets(playerId: string): Bet[] {
    return Array.from(this.bets.values())
      .filter(bet => bet.playerId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTournamentBets(tournamentId: string): Bet[] {
    return Array.from(this.bets.values())
      .filter(bet => bet.tournamentId === tournamentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getBettingStats(tournamentId: string): BettingStats | undefined {
    return this.bettingStats.get(tournamentId);
  }

  getPlayerBettingStats(tournamentId: string, playerId: string) {
    return this.bettingStats.get(tournamentId)?.playerStats.get(playerId);
  }
} 