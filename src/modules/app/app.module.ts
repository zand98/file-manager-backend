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
          WEBTOKEN_SECRET_KEY: 'secret',
          WEBTOKEN_EXPIRATION_TIME: configService.get(
            'WEBTOKEN_EXPIRATION_TIME',
          ),
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          // entities: [Admin, category, Product, subcategory, country, currency, city, User, Role, chat],
          entities: [__dirname + './../**/**.entity{.ts,.js}'],
          // synchronize: false,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
