import { parse } from 'dotenv';
import * as joi from 'joi';
import * as fs from 'fs';

export interface EnvConfig {
  [key: string]: string;
}

export class ConfigService {
  /**
   * Object that will contain the injected environment variables
   */
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = parse(fs.readFileSync(filePath));
    this.envConfig = ConfigService.validateInput(config);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   * @param {EnvConfig} envConfig the configuration object with variables from the configuration file
   * @returns {EnvConfig} a validated environment configuration object
   */
  private static validateInput(envConfig: EnvConfig): EnvConfig {
    /**
     * A schema to validate envConfig against
     */
    const envVarsSchema: joi.ObjectSchema = joi.object({
      APP_ENV: joi.string().valid('dev', 'prod').required(),
      APP_URL: joi.string().uri({
        scheme: [/https?/],
      }),
      WEBTOKEN_SECRET_KEY: joi.string().required(),
      WEBTOKEN_EXPIRATION_TIME: joi.number().default(1800),
      PORT: joi.string().required(),
      APP_NAME: joi.string().required(),
      DB_TYPE: joi.string().default('mysql'),
      DB_USERNAME: joi.string().default(''),
      DB_PASSWORD: joi.string().allow('').default(''),
      DB_HOST: joi.string().default(''),
      DB_PORT: joi.number().default('3306'),
      DB_EXTERNAL_PORT: joi.number().optional(),
      DB_DATABASE: joi.string().default(''),
      MINIO_ENDPOINT: joi.string().optional(),
      MINIO_PORT: joi.number().optional().default(9000),
      MINIO_ACCESS_KEY: joi.string().optional(),
      MINIO_SECRET_KEY: joi.string().optional(),
      MINIO_BUCKET_NAME: joi.string().optional().default('file-explorer'),
      // New Auth/Redis variables
      ACCESS_TOKEN_SECRET_KEY: joi.string().optional(), // Make optional or required based on strictness
      ACCESS_TOKEN_EXPIRATION_TIME: joi.string().optional().default('15m'),
      REFRESH_TOKEN_SECRET_KEY: joi.string().optional(),
      REFRESH_TOKEN_EXPIRATION_TIME: joi.string().optional().default('7d'),
      REDIS_HOST: joi.string().default('127.0.0.1'),
      REDIS_PORT: joi.number().default(6379),
      OTP_DISABLE: joi.string().valid('true', 'false').default('false'),
    });

    /**
     * Represents the status of validation check on the configuration file
     */
    const { error, value: validatedEnvConfig } =
      envVarsSchema.validate(envConfig);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  /**
   * Fetches the key from the configuration file
   * @param {string} key
   * @returns {string} the associated value for a given key
   */
  /**
   * Fetches the key from the configuration file
   * @param {string} key
   * @returns {string} the associated value for a given key
   */
  get(key: string): string {
    return process.env[key] || this.envConfig[key];
  }

  /**
   * Checks whether the application environment set in the configuration file matches the environment parameter
   * @param {string} env
   * @returns {boolean} Whether or not the environment variable matches the application environment
   */
  isEnv(env: string): boolean {
    const appEnv = process.env.APP_ENV || this.envConfig.APP_ENV;
    return appEnv === env;
  }
}
