describe('Cross Browser Compatibility', () => {
  const viewports = [
    { width: 1920, height: 1080, device: 'desktop' },
    { width: 768, height: 1024, device: 'tablet' },
    { width: 375, height: 812, device: 'mobile' }
  ];

  viewports.forEach(({ width, height, device }) => {
    describe(`${device} viewport (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
        cy.get('[data-testid="game-board"]').should('be.visible');
      });

      it('renders game board correctly', () => {
        // Check layout and visibility of core components
        cy.get('[data-testid="player-hand"]').should('be.visible');
        cy.get('[data-testid="ai-hand"]').should('be.visible');
        cy.get('[data-testid="play-cards-button"]').should('be.visible');
        cy.get('[data-testid="value-select"]').should('be.visible');
      });

      it('handles card selection and playing', () => {
        // Test card interaction
        cy.get('[data-testid="player-card"]').first().click();
        cy.get('[data-testid="player-card"]').first().should('have.class', 'selected');
        
        // Test value selection
        cy.get('[data-testid="value-select"]').select('A');
        
        // Test playing cards
        cy.get('[data-testid="play-cards-button"]').click();
        cy.get('[data-testid="last-move"]').should('be.visible');
      });

      it('displays game status correctly', () => {
        // Check game status visibility
        cy.get('[data-testid="game-status"]').should('be.visible');
        cy.get('[data-testid="current-player"]').should('be.visible');
      });

      it('handles touch interactions on mobile', () => {
        if (device === 'mobile' || device === 'tablet') {
          // Test touch-specific interactions
          cy.get('[data-testid="player-card"]').first().trigger('touchstart');
          cy.get('[data-testid="player-card"]').first().should('have.class', 'selected');
          
          // Test touch scrolling of hand
          cy.get('[data-testid="player-hand"]')
            .trigger('touchstart', { touches: [{ clientX: 200, clientY: 200 }] })
            .trigger('touchmove', { touches: [{ clientX: 100, clientY: 200 }] })
            .trigger('touchend');
        }
      });

      it('maintains aspect ratio of cards', () => {
        // Check card dimensions
        cy.get('[data-testid="player-card"]').first()
          .should(($card) => {
            const ratio = $card.width() / $card.height();
            expect(ratio).to.be.closeTo(0.7, 0.1); // Standard card ratio
          });
      });
    });
  });
}); 