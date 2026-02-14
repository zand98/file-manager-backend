import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '../config/config.module'; // Use local ConfigModule
import { RedisService } from './redis.service';

@Global() // Make it global so we don't need to import it everywhere
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
