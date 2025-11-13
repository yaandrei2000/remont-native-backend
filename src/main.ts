import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getSwaggerConfig } from './config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  });

  const swaggerComfig = getSwaggerConfig();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerComfig);

  SwaggerModule.setup('/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'openapi.json',
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server is running on: http://localhost:${port}`);
}
bootstrap();
