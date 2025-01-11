import { DataCollector, PlayerMove, ChallengeData } from '../DataCollection';
import { GameState, Card } from '../../types/game';

describe('DataCollector', () => {
  let dataCollector: DataCollector;
  const mockPlayerId = 'player1';
  
  beforeEach(() => {
    dataCollector = new DataCollector();
  });
  
  const createMockGameState = (): GameState => ({
    players: [],
    currentPlayer: mockPlayerId,
    pile: [],
    lastMove: null,
    gameStatus: 'playing',
    winner: null
  });
  
  const createMockMove = (wasBluff: boolean): PlayerMove => ({
    cards: [{ suit: 'hearts', value: 'A' }],
    declaredValue: 'A',
    wasBluff,
    gameState: createMockGameState(),
    timestamp: Date.now()
  });
  
  const createMockChallenge = (success: boolean): ChallengeData => ({
    success,
    opponentMove: createMockMove(!success),
    gameState: createMockGameState(),
    timestamp: Date.now()
  });
  
  describe('recordMove', () => {
    it('should create new player data when recording first move', () => {
      const move = createMockMove(false);
      dataCollector.recordMove(mockPlayerId, move);
      
      const playerData = dataCollector.getPlayerData(mockPlayerId);
      expect(playerData).toBeDefined();
      expect(playerData?.moves).toHaveLength(1);
      expect(playerData?.moves[0]).toEqual(move);
    });
    
    it('should calculate bluff frequency correctly', () => {
      dataCollector.recordMove(mockPlayerId, createMockMove(true));
      dataCollector.recordMove(mockPlayerId, createMockMove(false));
      dataCollector.recordMove(mockPlayerId, createMockMove(true));
      
      const playerData = dataCollector.getPlayerData(mockPlayerId);
      expect(playerData?.bluffFrequency).toBe(2/3);
    });
    
    it('should update preferred card combinations', () => {
      const move = createMockMove(false);
      dataCollector.recordMove(mockPlayerId, move);
      
      const playerData = dataCollector.getPlayerData(mockPlayerId);
      expect(playerData?.preferredCardCombos).toHaveLength(1);
      expect(playerData?.preferredCardCombos[0].cards).toEqual(move.cards);
    });
  });
  
  describe('recordChallenge', () => {
    it('should create new player data when recording first challenge', () => {
      const challenge = createMockChallenge(true);
      dataCollector.recordChallenge(mockPlayerId, challenge);
      
      const playerData = dataCollector.getPlayerData(mockPlayerId);
      expect(playerData).toBeDefined();
      expect(playerData?.challenges).toHaveLength(1);
      expect(playerData?.challenges[0]).toEqual(challenge);
    });
    
    it('should calculate challenge success rate correctly', () => {
      dataCollector.recordChallenge(mockPlayerId, createMockChallenge(true));
      dataCollector.recordChallenge(mockPlayerId, createMockChallenge(false));
      dataCollector.recordChallenge(mockPlayerId, createMockChallenge(true));
      
      const playerData = dataCollector.getPlayerData(mockPlayerId);
      expect(playerData?.challengeSuccessRate).toBe(2/3);
    });
  });
  
  describe('getAllPlayersData', () => {
    it('should return data for all players', () => {
      dataCollector.recordMove('player1', createMockMove(false));
      dataCollector.recordMove('player2', createMockMove(true));
      
      const allData = dataCollector.getAllPlayersData();
      expect(allData).toHaveLength(2);
      expect(allData.map(d => d.playerId)).toContain('player1');
      expect(allData.map(d => d.playerId)).toContain('player2');
    });
  });
}); 