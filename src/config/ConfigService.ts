import {env, type Env} from "./env";

export type LogLevel = 'info' | 'debug' | 'error' | 'warn' | 'fatal' | 'trace' | 'silent';

export class ConfigService {
  private readonly config: Env;

  constructor(env: Env) {
    this.config = env;
  }

  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.config.NODE_ENV;
  }

  get port(): number {
    return this.config.PORT;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get jwtAccessSecret(): string {
    return this.config.JWT_ACCESS_SECRET;
  }

  get jwtRefreshSecret(): string {
    return this.config.JWT_REFRESH_SECRET;
  }

  get jwtAccessTTL(): string {
    return this.config.JWT_ACCESS_TTL;
  }

  get jwtRefreshTTL(): string {
    return this.config.JWT_REFRESH_TTL;
  }

  get jwtIssuer(): string {
    return this.config.JWT_ISSUER;
  }

  get jwtAudience(): string {
    return this.config.JWT_AUDIENCE;
  }

  get corsOrigin(): string | string[] {
    const origin = this.config.CORS_ORIGIN;
    if (origin.includes(',')) {
      return origin.split(',').map((o) => o.trim());
    }
    return origin;
  }

  get logLevel(): LogLevel {
    return this.config.LOG_LEVEL;
  }
}

export const config = new ConfigService(env)
