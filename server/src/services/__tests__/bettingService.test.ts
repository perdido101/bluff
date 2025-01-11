import { BettingService, Bet } from '../bettingService';
import { PersistenceService } from '../persistenceService';

jest.mock('../persistenceService');

describe('BettingService', () => {
  let bettingService: BettingService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    bettingService = new BettingService(mockPersistenceService);
  });

  const createMockBet = () => ({
    tournamentId: 'tournament1',
    matchId: 'match1',
    playerId: 'player1',
    amount: 100,
    predictedWinnerId: 'player2'
  });

  it('places bet correctly', async () => {
    const mockBetData = createMockBet();
    const bet = await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    expect(bet.id).toBeDefined();
    expect(bet.status).toBe('PENDING');
    expect(bet.timestamp).toBeDefined();
    expect(bet.amount).toBe(100);
  });

  it('rejects invalid bet amount', async () => {
    const mockBetData = createMockBet();
    await expect(
      bettingService.placeBet(
        mockBetData.tournamentId,
        mockBetData.matchId,
        mockBetData.playerId,
        -50,
        mockBetData.predictedWinnerId
      )
    ).rejects.toThrow('Bet amount must be positive');
  });

  it('resolves winning bet correctly', async () => {
    const mockBetData = createMockBet();
    const bet = await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    const resolvedBet = await bettingService.resolveBet(bet.id, mockBetData.predictedWinnerId);
    expect(resolvedBet.status).toBe('WON');
    expect(resolvedBet.payout).toBe(180); // 1.8x multiplier
  });

  it('resolves losing bet correctly', async () => {
    const mockBetData = createMockBet();
    const bet = await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    const resolvedBet = await bettingService.resolveBet(bet.id, 'player3');
    expect(resolvedBet.status).toBe('LOST');
    expect(resolvedBet.payout).toBeUndefined();
  });

  it('tracks betting stats correctly', async () => {
    const mockBetData = createMockBet();
    const bet = await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    await bettingService.resolveBet(bet.id, mockBetData.predictedWinnerId);

    const stats = bettingService.getBettingStats(mockBetData.tournamentId);
    expect(stats).toBeDefined();
    expect(stats!.totalBets).toBe(1);
    expect(stats!.totalWagered).toBe(100);
    expect(stats!.totalPayout).toBe(180);

    const playerStats = bettingService.getPlayerBettingStats(mockBetData.tournamentId, mockBetData.playerId);
    expect(playerStats).toBeDefined();
    expect(playerStats!.betsPlaced).toBe(1);
    expect(playerStats!.betsWon).toBe(1);
    expect(playerStats!.winRate).toBe(1);
  });

  it('retrieves match bets correctly', async () => {
    const mockBetData = createMockBet();
    await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    const matchBets = bettingService.getMatchBets(mockBetData.matchId);
    expect(matchBets).toHaveLength(1);
    expect(matchBets[0].matchId).toBe(mockBetData.matchId);
  });

  it('retrieves player bets correctly', async () => {
    const mockBetData = createMockBet();
    await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    const playerBets = bettingService.getPlayerBets(mockBetData.playerId);
    expect(playerBets).toHaveLength(1);
    expect(playerBets[0].playerId).toBe(mockBetData.playerId);
  });

  it('retrieves tournament bets correctly', async () => {
    const mockBetData = createMockBet();
    await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    const tournamentBets = bettingService.getTournamentBets(mockBetData.tournamentId);
    expect(tournamentBets).toHaveLength(1);
    expect(tournamentBets[0].tournamentId).toBe(mockBetData.tournamentId);
  });

  it('prevents resolving already resolved bet', async () => {
    const mockBetData = createMockBet();
    const bet = await bettingService.placeBet(
      mockBetData.tournamentId,
      mockBetData.matchId,
      mockBetData.playerId,
      mockBetData.amount,
      mockBetData.predictedWinnerId
    );

    await bettingService.resolveBet(bet.id, mockBetData.predictedWinnerId);
    await expect(
      bettingService.resolveBet(bet.id, mockBetData.predictedWinnerId)
    ).rejects.toThrow('Bet already resolved');
  });
}); 