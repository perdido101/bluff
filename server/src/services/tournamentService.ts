import { PersistenceService } from './persistenceService';

export type TournamentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type BracketType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN';

export interface TournamentMatch {
  id: string;
  roundNumber: number;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  status: MatchStatus;
  startTime?: number;
  endTime?: number;
  gameStats?: {
    player1Bluffs: number;
    player2Bluffs: number;
    player1Challenges: number;
    player2Challenges: number;
    totalTurns: number;
  };
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: number;
  endDate?: number;
  status: TournamentStatus;
  bracketType: BracketType;
  playerIds: string[];
  matches: TournamentMatch[];
  prizePool?: number;
  minEloRating?: number;
  maxParticipants: number;
  currentRound: number;
  winner?: string;
}

export interface TournamentStats {
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  totalBluffs: number;
  totalChallenges: number;
  playerStats: Map<string, {
    matchesPlayed: number;
    matchesWon: number;
    totalBluffs: number;
    successfulBluffs: number;
    totalChallenges: number;
    successfulChallenges: number;
  }>;
}

export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();
  private tournamentStats: Map<string, TournamentStats> = new Map();
  private readonly persistenceService: PersistenceService;

  constructor(persistenceService: PersistenceService) {
    this.persistenceService = persistenceService;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const savedTournaments = await this.persistenceService.load('tournaments');
      const savedStats = await this.persistenceService.load('tournamentStats');
      
      if (savedTournaments) {
        this.tournaments = new Map(Object.entries(savedTournaments));
      }
      
      if (savedStats) {
        this.tournamentStats = new Map(Object.entries(savedStats));
      }
    } catch (error) {
      console.error('Failed to load tournament data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const tournamentsObj = Object.fromEntries(this.tournaments);
      const statsObj = Object.fromEntries(this.tournamentStats);
      
      await this.persistenceService.save('tournaments', tournamentsObj);
      await this.persistenceService.save('tournamentStats', statsObj);
    } catch (error) {
      console.error('Failed to save tournament data:', error);
    }
  }

  async createTournament(tournament: Omit<Tournament, 'id' | 'matches' | 'status' | 'currentRound'>): Promise<Tournament> {
    const id = `tournament_${Date.now()}`;
    const newTournament: Tournament = {
      ...tournament,
      id,
      status: 'PENDING',
      matches: [],
      currentRound: 0
    };

    this.tournaments.set(id, newTournament);
    this.initializeTournamentStats(id);
    await this.saveData();
    return newTournament;
  }

  private initializeTournamentStats(tournamentId: string): void {
    this.tournamentStats.set(tournamentId, {
      totalMatches: 0,
      completedMatches: 0,
      averageMatchDuration: 0,
      totalBluffs: 0,
      totalChallenges: 0,
      playerStats: new Map()
    });
  }

  async startTournament(tournamentId: string): Promise<Tournament> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'PENDING') throw new Error('Tournament already started');

    tournament.status = 'IN_PROGRESS';
    tournament.currentRound = 1;
    tournament.matches = this.generateMatches(tournament);
    
    await this.saveData();
    return tournament;
  }

  private generateMatches(tournament: Tournament): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const players = [...tournament.playerIds];
    
    // Shuffle players for random matchups
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    // Generate first round matches
    for (let i = 0; i < players.length - 1; i += 2) {
      matches.push({
        id: `match_${Date.now()}_${i}`,
        roundNumber: 1,
        player1Id: players[i],
        player2Id: players[i + 1],
        status: 'PENDING'
      });
    }

    // If odd number of players, give last player a bye
    if (players.length % 2 !== 0) {
      matches.push({
        id: `match_${Date.now()}_bye`,
        roundNumber: 1,
        player1Id: players[players.length - 1],
        player2Id: 'bye',
        status: 'PENDING'
      });
    }

    return matches;
  }

  async updateMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    gameStats: TournamentMatch['gameStats']
  ): Promise<Tournament> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');
    if (match.status === 'COMPLETED') throw new Error('Match already completed');

    // Update match
    match.winnerId = winnerId;
    match.status = 'COMPLETED';
    match.endTime = Date.now();
    match.gameStats = gameStats;

    // Update tournament stats
    this.updateTournamentStats(tournamentId, match);

    // Check if round is complete and generate next round matches if needed
    const roundComplete = tournament.matches
      .filter(m => m.roundNumber === tournament.currentRound)
      .every(m => m.status === 'COMPLETED');

    if (roundComplete) {
      const winners = tournament.matches
        .filter(m => m.roundNumber === tournament.currentRound)
        .map(m => m.winnerId!)
        .filter(id => id !== 'bye');

      if (winners.length === 1) {
        // Tournament complete
        tournament.status = 'COMPLETED';
        tournament.endDate = Date.now();
        tournament.winner = winners[0];
      } else {
        // Generate next round matches
        tournament.currentRound++;
        const nextRoundMatches = this.generateNextRoundMatches(winners, tournament.currentRound);
        tournament.matches.push(...nextRoundMatches);
      }
    }

    await this.saveData();
    return tournament;
  }

  private generateNextRoundMatches(winners: string[], roundNumber: number): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    
    for (let i = 0; i < winners.length - 1; i += 2) {
      matches.push({
        id: `match_${Date.now()}_${roundNumber}_${i}`,
        roundNumber,
        player1Id: winners[i],
        player2Id: winners[i + 1],
        status: 'PENDING'
      });
    }

    // Handle bye for odd number of winners
    if (winners.length % 2 !== 0) {
      matches.push({
        id: `match_${Date.now()}_${roundNumber}_bye`,
        roundNumber,
        player1Id: winners[winners.length - 1],
        player2Id: 'bye',
        status: 'PENDING'
      });
    }

    return matches;
  }

  private updateTournamentStats(tournamentId: string, match: TournamentMatch): void {
    const stats = this.tournamentStats.get(tournamentId)!;
    stats.completedMatches++;
    
    if (match.gameStats) {
      stats.totalBluffs += match.gameStats.player1Bluffs + match.gameStats.player2Bluffs;
      stats.totalChallenges += match.gameStats.player1Challenges + match.gameStats.player2Challenges;
      
      if (match.startTime && match.endTime) {
        const duration = match.endTime - match.startTime;
        stats.averageMatchDuration = (
          (stats.averageMatchDuration * (stats.completedMatches - 1) + duration)
          / stats.completedMatches
        );
      }

      // Update player stats
      [match.player1Id, match.player2Id].forEach(playerId => {
        if (playerId === 'bye') return;
        
        const playerStats = stats.playerStats.get(playerId) || {
          matchesPlayed: 0,
          matchesWon: 0,
          totalBluffs: 0,
          successfulBluffs: 0,
          totalChallenges: 0,
          successfulChallenges: 0
        };

        playerStats.matchesPlayed++;
        if (playerId === match.winnerId) {
          playerStats.matchesWon++;
        }

        if (playerId === match.player1Id) {
          playerStats.totalBluffs += match.gameStats!.player1Bluffs;
          playerStats.totalChallenges += match.gameStats!.player1Challenges;
        } else {
          playerStats.totalBluffs += match.gameStats!.player2Bluffs;
          playerStats.totalChallenges += match.gameStats!.player2Challenges;
        }

        stats.playerStats.set(playerId, playerStats);
      });
    }
  }

  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  getTournamentStats(tournamentId: string): TournamentStats | undefined {
    return this.tournamentStats.get(tournamentId);
  }

  getActiveTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status !== 'COMPLETED')
      .sort((a, b) => b.startDate - a.startDate);
  }

  getCompletedTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => b.endDate! - a.endDate!);
  }

  getPlayerTournaments(playerId: string): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.playerIds.includes(playerId))
      .sort((a, b) => b.startDate - a.startDate);
  }

  async cancelTournament(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status === 'COMPLETED') throw new Error('Tournament already completed');

    tournament.status = 'COMPLETED';
    tournament.endDate = Date.now();
    await this.saveData();
  }
} 