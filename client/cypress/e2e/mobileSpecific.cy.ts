describe('Mobile Specific Features', () => {
  const mobileViewports = [
    { width: 375, height: 812, device: 'iPhone X' },
    { width: 414, height: 896, device: 'iPhone XR' },
    { width: 360, height: 740, device: 'Android Pixel' }
  ];

  mobileViewports.forEach(({ width, height, device }) => {
    describe(`${device} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
        cy.get('[data-testid="game-board"]').should('be.visible');
      });

      it('handles card swipe gestures', () => {
        // Test horizontal swipe on player hand
        cy.get('[data-testid="player-hand"]')
          .trigger('touchstart', { touches: [{ clientX: 300, clientY: 400 }] })
          .trigger('touchmove', { touches: [{ clientX: 100, clientY: 400 }] })
          .trigger('touchend');

        // Verify scroll position changed
        cy.get('[data-testid="player-hand"]').should(($hand) => {
          expect($hand.scrollLeft()).to.be.greaterThan(0);
        });
      });

      it('supports pinch-to-zoom on cards', () => {
        cy.get('[data-testid="player-card"]').first()
          .trigger('touchstart', {
            touches: [
              { clientX: 100, clientY: 100 },
              { clientX: 120, clientY: 120 }
            ]
          })
          .trigger('touchmove', {
            touches: [
              { clientX: 90, clientY: 90 },
              { clientX: 130, clientY: 130 }
            ]
          })
          .trigger('touchend');

        // Verify card is zoomed
        cy.get('[data-testid="player-card"]').first()
          .should('have.class', 'zoomed');
      });

      it('shows mobile-optimized menus', () => {
        // Test hamburger menu
        cy.get('[data-testid="mobile-menu-button"]').should('be.visible').click();
        cy.get('[data-testid="mobile-menu"]').should('be.visible');
        
        // Verify menu items are properly sized for touch
        cy.get('[data-testid="mobile-menu"] button').should(($button) => {
          expect($button.height()).to.be.at.least(44); // iOS minimum touch target
        });
      });

      it('handles orientation changes', () => {
        // Test landscape orientation
        cy.viewport(height, width);
        cy.get('[data-testid="game-board"]').should('be.visible');
        cy.get('[data-testid="player-hand"]').should('be.visible');

        // Verify responsive layout adjustments
        cy.get('[data-testid="game-controls"]')
          .should('have.css', 'flex-direction', 'row');
      });

      it('manages touch keyboard interactions', () => {
        // Open value selection on mobile
        cy.get('[data-testid="value-select-mobile"]').click();
        
        // Verify mobile-optimized picker is shown
        cy.get('[data-testid="mobile-value-picker"]').should('be.visible');
        
        // Select a value
        cy.get('[data-testid="mobile-value-option"]').first().click();
        
        // Verify selection is applied
        cy.get('[data-testid="selected-value"]').should('not.be.empty');
      });

      it('handles offline mode gracefully', () => {
        // Simulate offline state
        cy.window().then((win) => {
          win.dispatchEvent(new Event('offline'));
        });

        // Verify offline indicator
        cy.get('[data-testid="offline-indicator"]').should('be.visible');
        
        // Verify game state is preserved
        cy.get('[data-testid="game-board"]').should('be.visible');
      });
    });
  });
}); 