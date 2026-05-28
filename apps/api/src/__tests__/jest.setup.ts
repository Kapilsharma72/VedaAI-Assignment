/**
 * Jest global setup — sets required environment variables before any test
 * module is loaded, so env.ts validation passes without real infrastructure.
 */
process.env['MONGO_URI'] = 'mongodb://localhost:27017/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['JWT_SECRET'] = 'test-secret-for-jest-tests-minimum-32chars';
process.env['GOOGLE_CLIENT_ID'] = 'test-google-client-id';
process.env['GOOGLE_CLIENT_SECRET'] = 'test-google-client-secret';
process.env['FRONTEND_URL'] = 'http://localhost:3000';
process.env['GEMINI_API_KEY'] = 'test-gemini-api-key';
process.env['PORT'] = '5000';
