function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function optionalEnv(name: string, defaultValue: string): string {
    const value = process.env[name];
    if (value === undefined || value.trim() === '') {
        return defaultValue;
    }
    return value;
}
export interface EnvConfig {
    MONGO_URI: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    FRONTEND_URL: string;
    GEMINI_API_KEY: string;
    API_URL: string;
    PORT: number;
    isProduction: boolean;
}
const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = optionalEnv('API_URL', process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5000').replace(/\/$/, '');
const env: EnvConfig = {
    MONGO_URI: requireEnv('MONGO_URI'),
    REDIS_URL: requireEnv('REDIS_URL'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
    FRONTEND_URL: requireEnv('FRONTEND_URL').replace(/\/$/, ''),
    GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
    API_URL: apiUrl,
    PORT: parseInt(optionalEnv('PORT', '5000'), 10),
    isProduction,
};
export default env;
