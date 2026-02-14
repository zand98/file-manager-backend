import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get('REDIS_HOST') || '127.0.0.1';
    const portStr = this.configService.get('REDIS_PORT');
    const port = portStr ? parseInt(portStr, 10) : 6379;

    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  /**
   * Save data with optional TTL (Time To Live) in seconds
   */
  async saveData(key: string, data: any, ttlSeconds: number = 600): Promise<any> {
    const value = JSON.stringify(data);
    await this.client.set(key, value, 'EX', ttlSeconds);
    return data;
  }

  /**
   * Retrieve parsed data
   */
  async getData<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw as unknown as T;
    }
  }

  async delKey(key: string): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * Update a specific field in a JSON object stored at key
   */
  async updateField(key: string, field: string, value: any, defaultTTL: number = 600): Promise<any> {
    const currentData = await this.getData<any>(key);
    if (!currentData) return null;

    currentData[field] = value;
    
    // Check remaining TTL
    const ttl = await this.client.ttl(key);
    const newTTL = ttl > 0 ? ttl : defaultTTL;

    await this.saveData(key, currentData, newTTL);
    return currentData;
  }

  /**
   * Limit implementation: Get current count or initialize
   */
  async getOrInitializeCount(key: string, expirySeconds: number = 86400): Promise<number> {
    const val = await this.client.get(key);
    if (val !== null) return parseInt(val, 10);

    await this.client.set(key, '0', 'EX', expirySeconds);
    return 0;
  }

  async incrementCount(key: string): Promise<number> {
    const val = await this.client.incr(key);
    return val;
  }
}
