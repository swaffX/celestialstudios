/**
 * Jest Test Setup
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.createMockInteraction = (overrides = {}) => ({
    user: { id: '123456789', tag: 'TestUser#0001', username: 'TestUser' },
    guild: { id: '987654321', name: 'Test Guild' },
    channel: { id: '111111111', send: jest.fn() },
    reply: jest.fn(),
    editReply: jest.fn(),
    deferReply: jest.fn(),
    followUp: jest.fn(),
    options: {
        getString: jest.fn(),
        getUser: jest.fn(),
        getInteger: jest.fn(),
        getSubcommand: jest.fn()
    },
    ...overrides
});
