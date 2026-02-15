import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './modules/app/app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet, * as headers from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { useContainer } from 'class-validator';
import { PasswordRemoverInterceptor } from './shared/interceptor/passwordRemover.interceptor';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Filemanager')
    .setVersion('1.0')
    .addTag('api')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const corsOptions = {
    SECURE_CROSS_ORIGIN_OPENER_POLICY: 'same-origin-allow-popups',
    // allowedHeaders: ['*'],
    allowedHeaders: [
      'origin',
      'x-requested-with',
      'content-type',
      'accept',
      'authorization',
    ],
    credentials: true,
    origin: [
      // set authorized origins here
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173'
    ],
  };
  app.enableCors(corsOptions);

  app.use(cookieParser());

  app.use(
    helmet({

      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minutes
      max: 100, // limit each IP to 1000 requests per minute
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skip: (req) => {
        // Skip rate limiting for file upload part URL requests
        // These are high-volume requests during large file uploads (one per ~5MB chunk)
        return req.originalUrl.includes('/part-url') && req.method === 'GET';
      },
      message: {
        statusCode: 429,
        message: 'Too many requests, please try again later.',
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new PasswordRemoverInterceptor());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
