import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ford Facility Booking API')
    .setDescription(
      'REST API for facility booking (Turf, Badminton, …). ' +
        'Use POST /auth/mock-login to get a JWT, then Authorize with Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth')
    .addTag('facilities')
    .addTag('bookings')
    .addTag('admin')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT || 3001);
  // 0.0.0.0 so Expo Go on a physical phone can reach the API over LAN
  await app.listen(port, '0.0.0.0');
  console.log(`Ford Facility API listening on http://0.0.0.0:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON: http://localhost:${port}/docs-json`);
}

bootstrap();
