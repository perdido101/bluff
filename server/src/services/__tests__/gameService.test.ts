import { GameService } from '../gameService';
import { GameState, GameAction } from '../../types';

describe('GameService', () => {
  let gameService: GameService;
  let initialState: GameState;

  beforeEach(() => {
    gameService = new GameService();
    initialState = gameService.initializeGame();
  });

  test('initializes game correctly', () => {
    expect(initialState.playerHand.length).toBe(26);
    expect(initialState.aiHand).toBe(26);
    expect(initialState.centerPile).toHaveLength(0);
    expect(initialState.currentTurn).toBe('player');
    expect(initialState.lastPlay).toBeUndefined();
  });

  test('processes valid play cards move', async () => {
    const cards = initialState.playerHand.slice(0, 2);
    const action: GameAction = {
      type: 'PLAY_CARDS',
      payload: {
        cards,
        declaredValue: cards[0].value
      }
    };

    const newState = await gameService.processMove(action, initialState);
    expect(newState.playerHand).toHaveLength(initialState.playerHand.length - 2);
    expect(newState.centerPile).toHaveLength(2);
    expect(newState.currentTurn).toBe('ai');
  });

  test('processes challenge correctly when bluffing', async () => {
    // Setup a state where the AI just played a bluff
    const stateWithBluff: GameState = {
      ...initialState,
      centerPile: [{ suit: 'hearts', value: 'K' }],
      currentTurn: 'player',
      lastPlay: {
        player: 'ai',
        declaredCards: 'A',
        actualCards: [{ suit: 'hearts', value: 'K' }]
      }
    };

    const action: GameAction = { type: 'CHALLENGE' };
    const newState = await gameService.processMove(action, stateWithBluff);

    expect(newState.aiHand).toBe(stateWithBluff.aiHand + 1); // AI picks up the card
    expect(newState.centerPile).toHaveLength(0);
    expect(newState.lastPlay).toBeUndefined();
  });
}); 