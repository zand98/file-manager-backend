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

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('WEBTOKEN_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get('WEBTOKEN_EXPIRATION_TIME') || '3600s',
        },
      }),
      inject: [ConfigService], // Inject ConfigService
    }),

    ConfigModule,
    UserModule,
    RolesModule,
    TypeOrmModule.forFeature([Role]), // This provides the Role repository
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUserStrategy, RolesExistValidator],
  exports: [PassportModule.register({ defaultStrategy: 'jwt' })],
})
export class AuthModule {}
