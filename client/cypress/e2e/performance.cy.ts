describe('Performance Tests', () => {
  beforeEach(() => {
    // Clear memory and cache before each test
    cy.window().then((win) => {
      win.gc && win.gc();
      win.performance.clearResourceTimings();
    });
    
    // Start performance monitoring
    cy.window().then((win) => {
      win.performance.mark('test-start');
    });
  });

  afterEach(() => {
    // End performance monitoring
    cy.window().then((win) => {
      win.performance.mark('test-end');
      win.performance.measure('test-duration', 'test-start', 'test-end');
    });
  });

  describe('Initial Load Performance', () => {
    it('loads the game board within performance budget', () => {
      cy.window().then((win) => {
        win.performance.mark('load-start');
      });

      cy.visit('/');
      cy.get('[data-testid="game-board"]').should('be.visible').then(() => {
        cy.window().then((win) => {
          win.performance.mark('load-end');
          win.performance.measure('load-time', 'load-start', 'load-end');
          
          const loadMeasure = win.performance.getEntriesByName('load-time')[0];
          expect(loadMeasure.duration).to.be.below(3000); // 3s budget
        });
      });
    });

    it('renders initial card hand efficiently', () => {
      cy.visit('/');
      cy.window().then((win) => {
        win.performance.mark('cards-start');
      });

      cy.get('[data-testid="player-hand"]').find('[data-testid="player-card"]').should('have.length', 26).then(() => {
        cy.window().then((win) => {
          win.performance.mark('cards-end');
          win.performance.measure('cards-render-time', 'cards-start', 'cards-end');
          
          const renderMeasure = win.performance.getEntriesByName('cards-render-time')[0];
          expect(renderMeasure.duration).to.be.below(1000); // 1s budget
        });
      });
    });
  });

  describe('Interaction Performance', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('[data-testid="game-board"]').should('be.visible');
    });

    it('responds to card selection within performance budget', () => {
      cy.window().then((win) => {
        win.performance.mark('selection-start');
      });

      cy.get('[data-testid="player-card"]').first().click();

      cy.get('[data-testid="player-card"]').first().should('have.class', 'selected').then(() => {
        cy.window().then((win) => {
          win.performance.mark('selection-end');
          win.performance.measure('selection-time', 'selection-start', 'selection-end');
          
          const selectionMeasure = win.performance.getEntriesByName('selection-time')[0];
          expect(selectionMeasure.duration).to.be.below(100); // 100ms budget
        });
      });
    });

    it('handles rapid card plays efficiently', () => {
      const playCount = 5;
      const plays = Array(playCount).fill(null);
      
      cy.window().then((win) => {
        win.performance.mark('plays-start');
      });

      plays.forEach(() => {
        cy.get('[data-testid="player-card"]').first().click();
        cy.get('[data-testid="value-select"]').select('A');
        cy.get('[data-testid="play-cards-button"]').click();
        cy.get('[data-testid="current-player"]').should('be.visible');
      });

      cy.window().then((win) => {
        win.performance.mark('plays-end');
        win.performance.measure('plays-time', 'plays-start', 'plays-end');
        
        const playsTime = win.performance.getEntriesByName('plays-time')[0];
        const averagePlayTime = playsTime.duration / playCount;
        expect(averagePlayTime).to.be.below(500); // 500ms per play budget
      });
    });
  });

  describe('Memory Usage', () => {
    it('maintains stable memory usage during extended play', () => {
      cy.visit('/');
      
      // Record initial memory
      let initialMemory;
      cy.window().then((win) => {
        initialMemory = win.performance.memory?.usedJSHeapSize;
      });

      // Play multiple rounds
      const rounds = 10;
      for (let i = 0; i < rounds; i++) {
        cy.get('[data-testid="player-card"]').first().click();
        cy.get('[data-testid="value-select"]').select('A');
        cy.get('[data-testid="play-cards-button"]').click();
        cy.get('[data-testid="current-player"]').should('be.visible');
      }

      // Check final memory
      cy.window().then((win) => {
        const finalMemory = win.performance.memory?.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Allow for some memory increase but not excessive
        expect(memoryIncrease).to.be.below(50 * 1024 * 1024); // 50MB limit
      });
    });

    it('cleans up resources after game completion', () => {
      cy.visit('/');
      
      // Complete a game
      cy.intercept('GET', '/api/gameState', {
        statusCode: 200,
        body: {
          gameStatus: 'finished',
          winner: 'player'
        }
      });

      // Record memory after game ends
      let gameEndMemory;
      cy.window().then((win) => {
        gameEndMemory = win.performance.memory?.usedJSHeapSize;
      });

      // Start new game
      cy.get('[data-testid="play-again-button"]').click();

      // Verify memory cleanup
      cy.window().then((win) => {
        const newGameMemory = win.performance.memory?.usedJSHeapSize;
        expect(newGameMemory).to.be.at.most(gameEndMemory * 1.1); // Allow 10% overhead
      });
    });
  });
}); 