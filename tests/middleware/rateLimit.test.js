/**
 * Rate Limit Middleware Tests
 */

const { checkRateLimit, getCooldownMessage, clearRateLimits, RATE_LIMITS } = require('../../src/middleware/rateLimit');

describe('Rate Limit Middleware', () => {
    beforeEach(() => {
        clearRateLimits();
    });

    describe('checkRateLimit', () => {
        it('should allow first action', () => {
            const result = checkRateLimit('user123', 'test_action', 3000);
            expect(result.allowed).toBe(true);
            expect(result.remainingMs).toBe(0);
        });

        it('should block rapid repeated actions', () => {
            checkRateLimit('user123', 'test_action', 3000);
            const result = checkRateLimit('user123', 'test_action', 3000);
            expect(result.allowed).toBe(false);
            expect(result.remainingMs).toBeGreaterThan(0);
        });

        it('should allow action after cooldown expires', async () => {
            checkRateLimit('user123', 'test_action', 100);
            await new Promise(resolve => setTimeout(resolve, 150));
            const result = checkRateLimit('user123', 'test_action', 100);
            expect(result.allowed).toBe(true);
        });

        it('should track different actions separately', () => {
            checkRateLimit('user123', 'action_a', 3000);
            const result = checkRateLimit('user123', 'action_b', 3000);
            expect(result.allowed).toBe(true);
        });

        it('should track different users separately', () => {
            checkRateLimit('user123', 'test_action', 3000);
            const result = checkRateLimit('user456', 'test_action', 3000);
            expect(result.allowed).toBe(true);
        });
    });

    describe('getCooldownMessage', () => {
        it('should format singular second correctly', () => {
            const message = getCooldownMessage(1000);
            expect(message).toContain('1 second');
            expect(message).not.toContain('seconds');
        });

        it('should format plural seconds correctly', () => {
            const message = getCooldownMessage(5000);
            expect(message).toContain('5 seconds');
        });

        it('should round up milliseconds', () => {
            const message = getCooldownMessage(1500);
            expect(message).toContain('2 seconds');
        });
    });

    describe('clearRateLimits', () => {
        it('should clear all rate limits when no userId provided', () => {
            checkRateLimit('user123', 'action_a', 3000);
            checkRateLimit('user456', 'action_b', 3000);
            clearRateLimits();

            const result1 = checkRateLimit('user123', 'action_a', 3000);
            const result2 = checkRateLimit('user456', 'action_b', 3000);

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(true);
        });

        it('should clear only specific user rate limits', () => {
            checkRateLimit('user123', 'action_a', 3000);
            checkRateLimit('user456', 'action_b', 3000);
            clearRateLimits('user123');

            const result1 = checkRateLimit('user123', 'action_a', 3000);
            const result2 = checkRateLimit('user456', 'action_b', 3000);

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(false);
        });
    });

    describe('RATE_LIMITS constants', () => {
        it('should have all required rate limit values', () => {
            expect(RATE_LIMITS.GIVEAWAY_ENTRY).toBeDefined();
            expect(RATE_LIMITS.BUTTON_CLICK).toBeDefined();
            expect(RATE_LIMITS.COMMAND).toBeDefined();
            expect(RATE_LIMITS.TICKET_CREATE).toBeDefined();
        });

        it('should have reasonable values', () => {
            expect(RATE_LIMITS.GIVEAWAY_ENTRY).toBeGreaterThanOrEqual(1000);
            expect(RATE_LIMITS.TICKET_CREATE).toBeGreaterThanOrEqual(30000);
        });
    });
});
