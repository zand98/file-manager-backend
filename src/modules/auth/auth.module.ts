import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtUserStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { RolesModule } from '../roles/roles.module';
import { UserModule } from '../user/user.module';
import { RolesExistValidator } from '../validators/roles-exist.validator';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/roles.entity';
import { User } from '../user/entities/user.entity';
import { RedisModule } from '../redis/redis.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('ACCESS_TOKEN_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get('ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
        },
      }),
      inject: [ConfigService], // Inject ConfigService
    }),


    ConfigModule,
    UserModule,
    RolesModule,
    RedisModule,
    SharedModule,
    TypeOrmModule.forFeature([Role, User]), // Needed for direct access if required, but aiming for Service usage
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUserStrategy, RolesExistValidator],
  exports: [PassportModule.register({ defaultStrategy: 'jwt' })],
})
export class AuthModule {}
