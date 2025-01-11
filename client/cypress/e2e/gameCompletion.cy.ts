describe('Game Completion Flow', () => {
  beforeEach(() => {
    // Visit the game page before each test
    cy.visit('/');
    // Wait for the game board to be fully loaded
    cy.get('[data-testid="game-board"]').should('be.visible');
  });

  it('completes a full game successfully', () => {
    // Verify initial game state
    cy.get('[data-testid="player-hand"]').should('exist');
    cy.get('[data-testid="ai-hand"]').should('exist');
    cy.get('[data-testid="play-cards-button"]').should('be.enabled');

    // Play multiple rounds
    for (let round = 0; round < 5; round++) {
      // Select first available card
      cy.get('[data-testid="player-card"]').first().click();

      // Select a value
      cy.get('[data-testid="value-select"]').select('A');

      // Play the cards
      cy.get('[data-testid="play-cards-button"]').click();

      // Wait for AI's turn to complete
      cy.get('[data-testid="current-player"]').should('contain', 'Your turn');
    }

    // Verify game progression
    cy.get('[data-testid="player-hand"]')
      .find('[data-testid="player-card"]')
      .its('length')
      .should('be.lessThan', 26); // Should have played some cards
  });

  it('handles winning condition', () => {
    // Intercept game state to simulate near-win condition
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        players: [
          {
            id: 'player',
            hand: [{ suit: 'hearts', value: 'A' }], // Only one card left
            isAI: false
          },
          {
            id: 'ai',
            hand: Array(5).fill({ suit: 'clubs', value: '2' }),
            isAI: true
          }
        ],
        currentPlayer: 'player',
        pile: [],
        lastMove: null,
        gameStatus: 'playing',
        winner: null
      }
    });

    // Play the last card
    cy.get('[data-testid="player-card"]').click();
    cy.get('[data-testid="value-select"]').select('A');
    cy.get('[data-testid="play-cards-button"]').click();

    // Verify win condition
    cy.get('[data-testid="game-status"]').should('contain', 'You win!');
    cy.get('[data-testid="play-again-button"]').should('be.visible');
  });

  it('handles losing condition', () => {
    // Intercept game state to simulate AI win
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        players: [
          {
            id: 'player',
            hand: Array(5).fill({ suit: 'hearts', value: 'A' }),
            isAI: false
          },
          {
            id: 'ai',
            hand: [], // AI has no cards
            isAI: true
          }
        ],
        currentPlayer: 'player',
        pile: [],
        lastMove: null,
        gameStatus: 'finished',
        winner: 'ai'
      }
    });

    // Verify loss condition
    cy.get('[data-testid="game-status"]').should('contain', 'AI wins!');
    cy.get('[data-testid="play-again-button"]').should('be.visible');
  });

  it('allows starting a new game after completion', () => {
    // Complete a game first
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        gameStatus: 'finished',
        winner: 'player'
      }
    });

    // Click play again
    cy.get('[data-testid="play-again-button"]').click();

    // Verify new game started
    cy.get('[data-testid="game-status"]').should('contain', 'Your turn');
    cy.get('[data-testid="player-hand"]')
      .find('[data-testid="player-card"]')
      .should('have.length', 26);
  });

  it('saves game statistics after completion', () => {
    // Complete a game
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        gameStatus: 'finished',
        winner: 'player',
        statistics: {
          totalMoves: 15,
          successfulBluffs: 3,
          successfulChallenges: 2
        }
      }
    });

    // Verify statistics are displayed
    cy.get('[data-testid="game-stats"]').should('be.visible');
    cy.get('[data-testid="total-moves"]').should('contain', '15');
    cy.get('[data-testid="successful-bluffs"]').should('contain', '3');
    cy.get('[data-testid="successful-challenges"]').should('contain', '2');
  });
}); 