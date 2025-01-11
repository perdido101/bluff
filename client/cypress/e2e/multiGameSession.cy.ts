describe('Multi-Game Session Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-testid="game-board"]').should('be.visible');
  });

  it('maintains player statistics across multiple games', () => {
    // Play first game
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        gameStatus: 'finished',
        winner: 'player',
        statistics: {
          totalMoves: 10,
          successfulBluffs: 2,
          successfulChallenges: 1
        }
      }
    }).as('firstGame');

    // Start new game
    cy.get('[data-testid="play-again-button"]').click();

    // Play second game
    cy.intercept('GET', '/api/gameState', {
      statusCode: 200,
      body: {
        gameStatus: 'finished',
        winner: 'ai',
        statistics: {
          totalMoves: 15,
          successfulBluffs: 3,
          successfulChallenges: 2
        }
      }
    }).as('secondGame');

    // Verify cumulative statistics
    cy.get('[data-testid="total-games-played"]').should('contain', '2');
    cy.get('[data-testid="win-rate"]').should('contain', '50%');
  });

  it('persists game state between sessions', () => {
    // Simulate saved game state
    localStorage.setItem('gameState', JSON.stringify({
      players: [
        {
          id: 'player',
          hand: [{ suit: 'hearts', value: 'A' }],
          isAI: false
        },
        {
          id: 'ai',
          hand: [{ suit: 'clubs', value: '2' }],
          isAI: true
        }
      ],
      currentPlayer: 'player',
      pile: [],
      lastMove: null,
      gameStatus: 'playing'
    }));

    // Reload page
    cy.reload();

    // Verify game state restored
    cy.get('[data-testid="player-hand"]')
      .find('[data-testid="player-card"]')
      .should('have.length', 1);
  });

  it('handles session recovery after browser refresh', () => {
    // Start a game and make some moves
    cy.get('[data-testid="player-card"]').first().click();
    cy.get('[data-testid="value-select"]').select('A');
    cy.get('[data-testid="play-cards-button"]').click();

    // Refresh the page
    cy.reload();

    // Verify game state persisted
    cy.get('[data-testid="last-move"]').should('exist');
    cy.get('[data-testid="current-player"]').should('be.visible');
  });

  it('tracks player performance history', () => {
    // Complete multiple games
    for (let i = 0; i < 3; i++) {
      cy.intercept('GET', '/api/gameState', {
        statusCode: 200,
        body: {
          gameStatus: 'finished',
          winner: i % 2 === 0 ? 'player' : 'ai',
          statistics: {
            totalMoves: 10 + i,
            successfulBluffs: 2 + i,
            successfulChallenges: 1 + i
          }
        }
      });

      if (i < 2) {
        cy.get('[data-testid="play-again-button"]').click();
      }
    }

    // Check performance history
    cy.get('[data-testid="performance-history"]').should('be.visible');
    cy.get('[data-testid="average-moves-per-game"]').should('exist');
    cy.get('[data-testid="bluff-success-rate"]').should('exist');
  });

  it('synchronizes game state across tabs', () => {
    // Open game in two tabs
    cy.window().then((win) => {
      const newWindow = win.open('/', '_blank');
      
      // Make a move in first tab
      cy.get('[data-testid="player-card"]').first().click();
      cy.get('[data-testid="value-select"]').select('A');
      cy.get('[data-testid="play-cards-button"]').click();

      // Verify state synced to second tab
      cy.wrap(newWindow).within(() => {
        cy.get('[data-testid="last-move"]').should('exist');
      });
    });
  });
}); 