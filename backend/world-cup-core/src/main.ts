import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env',
});

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import { SwaggerTheme } from 'swagger-themes';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './basic/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLoggerLevels(),
  });

  app.use(bodyParser.json({ limit: '1mb' }));

  app.use(compression());

  const configService = app.get(ConfigService);
  const appBasePath = sanitizeBasePath(configService.get<string>('APP_BASE_PATH', 'worldCupCore'));
  const allowedOrigin = configService.get<string>('CORS_ALLOWED_ORIGIN', 'http://localhost:3101');

  app.setGlobalPrefix(appBasePath);

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  setupSwagger(app, appBasePath);

  const port = configService.get<number>('APP_PORT', 4101);
  await app.listen(port);
}

function getLoggerLevels(): LogLevel[] {
  const configService = new ConfigService();
  const logLevel = configService.get<string>('APP_LOG_LEVEL', 'log');

  const levelMap: Record<string, LogLevel[]> = {
    error: ['error'],
    warn: ['error', 'warn'],
    log: ['error', 'warn', 'log'],
    debug: ['error', 'warn', 'log', 'debug'],
    verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
  };

  return levelMap[logLevel.toLowerCase()] || ['error', 'warn', 'log'];
}

function setupSwagger(app: any, appBasePath: string): void {
  const configService: ConfigService = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_APP_TITLE', 'World Cup Core Service'))
    .setDescription(configService.get('SWAGGER_APP_DESCRIPTION', 'World Cup Core API'))
    .setVersion(configService.get('SWAGGER_APP_VERSION', '1.0.0'))
    .addTag('admin')
    .addTag('my-team')
    .addTag('world-cup')
    .addTag('final-match')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const theme = new SwaggerTheme();
  const themeName = configService.get<string>('SWAGGER_THEME', 'classic');

  const swaggerCustomOptions: SwaggerCustomOptions = {
    customSiteTitle: configService.get('SWAGGER_APP_TITLE', 'World Cup Core Service'),
    customCss: theme.getBuffer(themeName as any),
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
      tryItOutEnabled: true,
    },
  };

  SwaggerModule.setup(`${appBasePath}/api`, app, document, swaggerCustomOptions);
}

function sanitizeBasePath(basePath: string): string {
  const sanitizedBasePath = basePath.trim().replace(/^\/+|\/+$/g, '');
  return sanitizedBasePath || 'worldCupCore';
}

bootstrap();
