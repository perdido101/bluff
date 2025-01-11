import { TournamentService, Tournament, TournamentMatch } from '../tournamentService';
import { PersistenceService } from '../persistenceService';

jest.mock('../persistenceService');

describe('TournamentService', () => {
  let tournamentService: TournamentService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    tournamentService = new TournamentService(mockPersistenceService);
  });

  const createMockTournament = () => ({
    name: 'Test Tournament',
    startDate: Date.now(),
    bracketType: 'SINGLE_ELIMINATION' as const,
    playerIds: ['player1', 'player2', 'player3', 'player4'],
    maxParticipants: 4
  });

  it('creates tournament correctly', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());

    expect(tournament.id).toBeDefined();
    expect(tournament.status).toBe('PENDING');
    expect(tournament.matches).toHaveLength(0);
    expect(tournament.currentRound).toBe(0);
  });

  it('starts tournament and generates first round matches', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());
    const started = await tournamentService.startTournament(tournament.id);

    expect(started.status).toBe('IN_PROGRESS');
    expect(started.currentRound).toBe(1);
    expect(started.matches).toHaveLength(2); // 4 players = 2 matches
    expect(started.matches[0].roundNumber).toBe(1);
  });

  it('handles odd number of players with bye', async () => {
    const tournament = await tournamentService.createTournament({
      ...createMockTournament(),
      playerIds: ['player1', 'player2', 'player3']
    });
    const started = await tournamentService.startTournament(tournament.id);

    expect(started.matches).toHaveLength(2);
    const byeMatch = started.matches.find(m => m.player2Id === 'bye');
    expect(byeMatch).toBeDefined();
  });

  it('updates match result and progresses tournament', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());
    await tournamentService.startTournament(tournament.id);

    const updatedTournament = await tournamentService.updateMatchResult(
      tournament.id,
      tournament.matches[0].id,
      'player1',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    const match = updatedTournament.matches[0];
    expect(match.status).toBe('COMPLETED');
    expect(match.winnerId).toBe('player1');
    expect(match.gameStats).toBeDefined();
  });

  it('generates next round matches when current round completes', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());
    await tournamentService.startTournament(tournament.id);

    // Complete first match
    await tournamentService.updateMatchResult(
      tournament.id,
      tournament.matches[0].id,
      'player1',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    // Complete second match
    const updatedTournament = await tournamentService.updateMatchResult(
      tournament.id,
      tournament.matches[1].id,
      'player3',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    expect(updatedTournament.currentRound).toBe(2);
    expect(updatedTournament.matches).toHaveLength(3); // 2 first round + 1 final
    const finalMatch = updatedTournament.matches.find(m => m.roundNumber === 2);
    expect(finalMatch?.player1Id).toBe('player1');
    expect(finalMatch?.player2Id).toBe('player3');
  });

  it('completes tournament when final match is done', async () => {
    const tournament = await tournamentService.createTournament({
      ...createMockTournament(),
      playerIds: ['player1', 'player2']
    });
    await tournamentService.startTournament(tournament.id);

    const completedTournament = await tournamentService.updateMatchResult(
      tournament.id,
      tournament.matches[0].id,
      'player1',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    expect(completedTournament.status).toBe('COMPLETED');
    expect(completedTournament.winner).toBe('player1');
    expect(completedTournament.endDate).toBeDefined();
  });

  it('tracks tournament statistics correctly', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());
    await tournamentService.startTournament(tournament.id);

    await tournamentService.updateMatchResult(
      tournament.id,
      tournament.matches[0].id,
      'player1',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    const stats = tournamentService.getTournamentStats(tournament.id);
    expect(stats).toBeDefined();
    expect(stats!.completedMatches).toBe(1);
    expect(stats!.totalBluffs).toBe(3);
    expect(stats!.totalChallenges).toBe(5);
  });

  it('retrieves active and completed tournaments', async () => {
    // Create and complete one tournament
    const tournament1 = await tournamentService.createTournament({
      ...createMockTournament(),
      playerIds: ['player1', 'player2']
    });
    await tournamentService.startTournament(tournament1.id);
    await tournamentService.updateMatchResult(
      tournament1.id,
      tournament1.matches[0].id,
      'player1',
      {
        player1Bluffs: 2,
        player2Bluffs: 1,
        player1Challenges: 3,
        player2Challenges: 2,
        totalTurns: 10
      }
    );

    // Create another pending tournament
    const tournament2 = await tournamentService.createTournament(createMockTournament());

    const activeTournaments = tournamentService.getActiveTournaments();
    const completedTournaments = tournamentService.getCompletedTournaments();

    expect(activeTournaments).toHaveLength(1);
    expect(completedTournaments).toHaveLength(1);
    expect(activeTournaments[0].id).toBe(tournament2.id);
    expect(completedTournaments[0].id).toBe(tournament1.id);
  });

  it('retrieves player tournaments', async () => {
    const tournament1 = await tournamentService.createTournament(createMockTournament());
    const tournament2 = await tournamentService.createTournament({
      ...createMockTournament(),
      playerIds: ['player5', 'player6']
    });

    const playerTournaments = tournamentService.getPlayerTournaments('player1');
    expect(playerTournaments).toHaveLength(1);
    expect(playerTournaments[0].id).toBe(tournament1.id);
  });

  it('cancels tournament', async () => {
    const tournament = await tournamentService.createTournament(createMockTournament());
    await tournamentService.startTournament(tournament.id);
    await tournamentService.cancelTournament(tournament.id);

    const cancelled = tournamentService.getTournament(tournament.id);
    expect(cancelled?.status).toBe('COMPLETED');
    expect(cancelled?.endDate).toBeDefined();
  });
}); 