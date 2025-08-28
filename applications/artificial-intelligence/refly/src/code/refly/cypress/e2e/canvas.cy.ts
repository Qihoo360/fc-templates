describe('Canvas Flow', () => {
  before(() => {
    cy.fixture('users-setup.sql').then((sql) => {
      cy.execSQL(sql);
    });
    cy.fixture('models-setup.sql').then((sql) => {
      cy.execSQL(sql);
    });
  });

  after(() => {
    cy.fixture('users-cleanup.sql').then((sql) => {
      cy.execSQL(sql);
    });
  });

  beforeEach(() => {
    cy.login('bob@example.com', 'testPassword123');
    // Add a small wait after login to ensure app is fully loaded
    cy.wait(2000);
  });

  it('should create and interact with canvas', () => {
    // Wait for the page to be fully loaded
    cy.url().should('include', '/canvas');

    // Create new canvas from empty state
    cy.get('[data-cy="empty-canvas-create-button"]')
      .should('be.visible')
      .and('exist')
      .and('be.enabled')
      .then(($btn) => {
        // Using .then() to break the command chain
        cy.wrap($btn).click();
      });

    // Wait for canvas to be created and loaded
    cy.location('pathname').should('match', /\/canvas\/[a-zA-Z0-9-]+$/);

    // Verify canvas toolbar is visible
    cy.get('[data-cy="canvas-toolbar"]').should('be.visible');
    cy.get('[data-cy="canvas-title-edit"]').should('be.visible').contains('Untitled');

    // Create a new document from canvas hint text
    // cy.get('[data-cy="canvas-create-document-button"]').should('be.visible').click();

    cy.get('[data-cy="launchpad-chat-panel"]').should('be.visible');

    // Break up the chain for typing and submitting
    cy.get('[data-cy="chat-input"]')
      .should('be.visible')
      .should('be.enabled')
      .clear()
      .type('Say this is a test', { delay: 50 });

    // Use a separate command for the Enter key
    cy.get('[data-cy="chat-input"]').type('{enter}');

    // Wait for the response node to be visible first
    cy.get('[data-cy="skill-response-node"]').should('be.visible');

    // Then wait for the header to be visible and contain the correct text
    cy.get('[data-cy="skill-response-node-header"]')
      .should('be.visible')
      .should('contain.text', 'Say this is a test');

    // Verify the response is displayed in the chat
    cy.get('[data-cy="skill-response-node"]').should('be.visible').contains('This is a test');
  });
});
