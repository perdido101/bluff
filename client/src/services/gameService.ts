import { GameState, Card, GameAction, Player } from '../types/game';
import { AIPlayer } from './AIPlayer';

export class GameService {
  private gameState: GameState;
  private aiPlayer: AIPlayer;

  constructor() {
    this.aiPlayer = new AIPlayer('ai');
    this.gameState = this.initializeGame();
  }

  private initializeGame(): GameState {
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);
    const halfDeck = Math.floor(shuffledDeck.length / 2);

    const playerHand = shuffledDeck.slice(0, halfDeck);
    const aiHand = shuffledDeck.slice(halfDeck);

    return {
      players: [
        { id: 'player', hand: playerHand, isAI: false },
        { id: 'ai', hand: aiHand, isAI: true }
      ],
      currentPlayer: 'player',
      pile: [],
      lastMove: null,
      gameStatus: 'playing',
      winner: null
    };
  }

  private createDeck(): Card[] {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          suit: suit as Card['suit'],
          value: value as Card['value']
        });
      }
    }

    return deck;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private validateMove(action: GameAction): boolean {
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return false;

    switch (action.type) {
      case 'PLAY_CARDS':
        if (!action.payload?.cards || !action.payload.declaredValue) return false;
        // Verify player has these cards
        return action.payload.cards.every(card =>
          player.hand.some(c => c.suit === card.suit && c.value === card.value)
        );

      case 'CHALLENGE':
        return !!this.gameState.lastMove;

      case 'PASS':
        return true;

      default:
        return false;
    }
  }

  private handleChallenge(challenger: Player): void {
    if (!this.gameState.lastMove) return;

    const lastPlayer = this.gameState.players.find(
      p => p.id === this.gameState.lastMove?.playerId
    );
    if (!lastPlayer) return;

    const lastCards = this.gameState.pile.slice(-this.gameState.lastMove.numberOfCards);
    const wasBluffing = lastCards.some(
      card => card.value !== this.gameState.lastMove?.declaredValue
    );

    if (wasBluffing) {
      // Last player was bluffing, they pick up the pile
      lastPlayer.hand = [...lastPlayer.hand, ...this.gameState.pile];
      this.gameState.currentPlayer = challenger.id;
    } else {
      // Challenger was wrong, they pick up the pile
      challenger.hand = [...challenger.hand, ...this.gameState.pile];
      this.gameState.currentPlayer = lastPlayer.id;
    }

    this.gameState.pile = [];
    this.gameState.lastMove = null;
  }

  public makeMove(action: GameAction): GameState {
    if (!this.validateMove(action)) {
      throw new Error('Invalid move');
    }

    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) throw new Error('Player not found');

    switch (action.type) {
      case 'PLAY_CARDS':
        if (!action.payload?.cards || !action.payload.declaredValue) break;
        
        // Remove cards from player's hand
        player.hand = player.hand.filter(card =>
          !action.payload.cards.some(c => 
            c.suit === card.suit && c.value === card.value
          )
        );

        // Add cards to pile
        this.gameState.pile.push(...action.payload.cards);
        
        // Update last move
        this.gameState.lastMove = {
          playerId: action.playerId,
          declaredValue: action.payload.declaredValue,
          numberOfCards: action.payload.cards.length
        };

        // Switch turns
        this.gameState.currentPlayer = this.gameState.players.find(
          p => p.id !== action.playerId
        )?.id || '';
        break;

      case 'CHALLENGE':
        this.handleChallenge(player);
        break;

      case 'PASS':
        this.gameState.currentPlayer = this.gameState.players.find(
          p => p.id !== action.playerId
        )?.id || '';
        break;
    }

    // Check for winner
    for (const player of this.gameState.players) {
      if (player.hand.length === 0) {
        this.gameState.gameStatus = 'finished';
        this.gameState.winner = player.id;
        break;
      }
    }

    // Record move for AI learning
    this.aiPlayer.recordMove(action);

    // If it's AI's turn, make AI move
    if (this.gameState.currentPlayer === 'ai' && this.gameState.gameStatus === 'playing') {
      const aiMove = this.aiPlayer.makeMove(this.gameState);
      this.makeMove(aiMove);
    }

    return { ...this.gameState };
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public resetGame(): void {
    this.gameState = this.initializeGame();
  }
} 