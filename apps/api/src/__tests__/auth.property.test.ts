// Feature: vedaai-assessment-creator, Property 1: Password Hash Irreversibility

/**
 * Property-Based Tests: Auth Service
 *
 * Property 1: Password Hash Irreversibility
 * Validates: Requirements 1.2, 14.8
 *
 * For any valid registration payload, the password stored in the database
 * must be a bcrypt hash — never the plaintext password — and bcrypt.compare
 * must confirm the hash matches the original plaintext.
 */

import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

// Capture the hashed password written to the DB via User.create()
let capturedHash: string | null = null;

jest.mock('../models/user.model', () => {
  return {
    User: {
      findOne: jest.fn().mockResolvedValue(null), // no existing user
      create: jest.fn().mockImplementation(async (data: Record<string, unknown>) => {
        capturedHash = data['password'] as string;
        return {
          _id: { toString: () => 'mock-user-id' },
          name: (data['name'] as string) ?? 'Test User',
          email: ((data['email'] as string) ?? 'test@example.com').toLowerCase(),
          password: data['password'] as string,
          schoolName: (data['schoolName'] as string) ?? 'Test School',
          location: (data['location'] as string) ?? 'Test Location',
          googleId: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          toObject: function () {
            return {
              _id: { toString: () => 'mock-user-id' },
              name: this.name,
              email: this.email,
              password: this.password,
              schoolName: this.schoolName,
              location: this.location,
              googleId: null,
              avatar: null,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt,
            };
          },
        };
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Import the service under test (after mocks are set up)
// ---------------------------------------------------------------------------
import * as authService from '../services/auth.service';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid password: 8–128 printable ASCII characters.
 * We avoid characters that could cause issues with bcrypt (null bytes).
 */
const validPassword = fc.string({ minLength: 8, maxLength: 128 }).filter(
  (s) => !s.includes('\0'),
);

/**
 * Generates a valid email address.
 */
const validEmail = fc.emailAddress();

/**
 * Generates a valid name: 1–100 non-empty characters.
 */
const validName = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length > 0,
);

/**
 * Generates a valid school name: 1–200 non-empty characters.
 */
const validSchoolName = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

/**
 * Generates a valid location: 1–200 non-empty characters.
 */
const validLocation = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

/**
 * Generates a complete valid registration DTO.
 */
const validRegistrationPayload = fc.record({
  name: validName,
  email: validEmail,
  password: validPassword,
  schoolName: validSchoolName,
  location: validLocation,
});

// ---------------------------------------------------------------------------
// Property 1: Password Hash Irreversibility
// ---------------------------------------------------------------------------

describe('Property 1: Password Hash Irreversibility', () => {
  beforeEach(() => {
    capturedHash = null;
    // Reset the mock so findOne always returns null (no existing user)
    const { User } = require('../models/user.model');
    (User.findOne as jest.Mock).mockResolvedValue(null);
  });

  /**
   * **Validates: Requirements 1.2, 14.8**
   *
   * For every valid registration payload:
   * 1. The hash stored in the DB must NOT equal the plaintext password.
   * 2. bcrypt.compare(plaintext, storedHash) must return true.
   */
  it('stores a bcrypt hash, never the plaintext password', async () => {
    await fc.assert(
      fc.asyncProperty(validRegistrationPayload, async (dto) => {
        capturedHash = null;

        await authService.register(dto);

        const storedHash = capturedHash;

        // The hash must have been captured
        expect(storedHash).not.toBeNull();
        expect(typeof storedHash).toBe('string');

        // Property 1a: stored value is NOT the plaintext password
        expect(storedHash).not.toBe(dto.password);

        // Property 1b: bcrypt.compare confirms the hash matches the plaintext
        const matches = await bcrypt.compare(dto.password, storedHash as unknown as string);
        expect(matches).toBe(true);
      }),
      { numRuns: 10 },
    );
  }, 30_000);
});
