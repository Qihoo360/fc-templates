/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare namespace Cypress {
  interface Chainable {
    /**
     * Execute SQL query through Docker container
     * @param query - SQL query to execute
     * @example
     * cy.execSQL('SELECT * FROM users')
     */
    execSQL(query: string): Chainable<string>;
    /**
     * Login to the app
     * @param email - Email to login with
     * @param password - Password to login with
     * @example
     * cy.login('test@example.com', 'testPassword123')
     */
    login(email: string, password: string): Chainable<void>;
  }
}

Cypress.Commands.add('execSQL', (query: string) => {
  // Write query to temp file first to avoid shell escaping issues
  const tempFile = '/tmp/cypress-sql-query.sql';
  cy.writeFile(tempFile, query);

  const command = `docker exec -i refly_db psql -tA '${Cypress.env('databaseUrl')}' < ${tempFile}`;

  cy.log(`Executing SQL command: ${command}`);

  cy.exec(command).then((result) => {
    cy.log(`SQL execution result: ${result.stdout}`);
  });
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-cy="try-for-free-button"]').click();
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="continue-button"]').click();
});

// Intercept all requests to api.github.com
beforeEach(() => {
  cy.intercept('GET', 'https://api.github.com/**', {
    statusCode: 200,
    body: {
      // Provide mock data that matches the GitHub API response structure
      // you can customize this based on your needs
      stargazers_count: 1000,
      forks_count: 500,
      subscribers_count: 100,
    },
  }).as('githubApi');

  cy.intercept('GET', 'https://react-tweet.vercel.app/api/tweet/**', {
    statusCode: 200,
    body: {
      data: {
        __typename: 'Tweet',
        lang: 'en',
        favorite_count: 2,
        // created_at: '2025-01-14T15:55:04.000Z',
        display_text_range: [0, 125],
        entities: {
          hashtags: [],
          urls: [],
          user_mentions: [],
          symbols: [],
        },
        id_str: '1879195537259294991',
        text: '',
        user: {
          id_str: '22260506',
          name: '',
          profile_image_url_https:
            'https://pbs.twimg.com/profile_images/1246941661311238144/K6r3twlf_normal.jpg',
          screen_name: 'ediyiqian',
          verified: false,
          is_blue_verified: true,
          profile_image_shape: 'Circle',
        },
        edit_control: {
          edit_tweet_ids: [],
          editable_until_msecs: '1736873704000',
          is_edit_eligible: true,
          edits_remaining: '5',
        },
        conversation_count: 1,
        news_action_type: 'conversation',
        isEdited: false,
        isStaleEdit: false,
        note_tweet: {
          id: '',
        },
      },
    },
  }).as('tweetApi');
});
