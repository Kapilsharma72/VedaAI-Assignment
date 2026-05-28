import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';
let capturedHash: string | null = null;
jest.mock('../models/user.model', () => {
    return {
        User: {
            findOne: jest.fn().mockResolvedValue(null),
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
import * as authService from '../services/auth.service';
const validPassword = fc.string({ minLength: 8, maxLength: 128 }).filter((s) => !s.includes('\0'));
const validEmail = fc.emailAddress();
const validName = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);
const validSchoolName = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);
const validLocation = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);
const validRegistrationPayload = fc.record({
    name: validName,
    email: validEmail,
    password: validPassword,
    schoolName: validSchoolName,
    location: validLocation,
});
describe('Property 1: Password Hash Irreversibility', () => {
    beforeEach(() => {
        capturedHash = null;
        const { User } = require('../models/user.model');
        (User.findOne as jest.Mock).mockResolvedValue(null);
    });
    it('stores a bcrypt hash, never the plaintext password', async () => {
        await fc.assert(fc.asyncProperty(validRegistrationPayload, async (dto) => {
            capturedHash = null;
            await authService.register(dto);
            const storedHash = capturedHash;
            expect(storedHash).not.toBeNull();
            expect(typeof storedHash).toBe('string');
            expect(storedHash).not.toBe(dto.password);
            const matches = await bcrypt.compare(dto.password, storedHash as unknown as string);
            expect(matches).toBe(true);
        }), { numRuns: 10 });
    }, 30000);
});
