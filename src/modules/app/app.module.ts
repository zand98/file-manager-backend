import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { UserModule } from '../user/user.module';
import { CasesModule } from '../cases/cases.module';
import { CollectionsModule } from '../collections/collections.module';
import { FilesModule } from '../files/files.module';
import { MinioModule } from '../minio/minio.module';
import { SharedModule } from '../../shared/shared.module';
import { RedisModule } from '../redis/redis.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    //  ServeStaticModule.forRoot({
    //    rootPath: join(__dirname, '../../../', 'public'),
    //  }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get('DB_TYPE'),
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [__dirname + './../**/**.entity{.ts,.js}'],
          synchronize: configService.isEnv('dev'),
          keepConnectionAlive: true,
        } as TypeOrmModuleAsyncOptions;
      },
    }),
    ConfigModule,
    UserModule,
    AuthModule,
    CasesModule,
    CollectionsModule,
    FilesModule,
    MinioModule,
    SharedModule,
    RedisModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
