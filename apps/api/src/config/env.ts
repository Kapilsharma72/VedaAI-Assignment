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
  PORT: number;
}

const env: EnvConfig = {
  MONGO_URI: requireEnv('MONGO_URI'),
  REDIS_URL: requireEnv('REDIS_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
};

export default env;
