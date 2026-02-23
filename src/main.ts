import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {

  // Create NestJS application instance
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Use cookie parser middleware to handle cookies (for refresh tokens)
  app.use(cookieParser());

  // Enable CORS for frontend development server (http://localhost:3000)
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  // Enable global request validation using class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Strip unknown properties
      forbidNonWhitelisted: true,   // Throw error on unknown properties
      transform: true,              // Auto-transform payloads to DTO types
    }),
  );

  // Serve uploaded media files from the 'uploads' directory at the '/uploads' URL path
  app.useStaticAssets('uploads', {
    prefix: '/uploads/',
  });

  // Configure Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('EcomPointer API')
    .setDescription('API documentation for EcomPointer backend')
    .setVersion('1.0')
    .setContact(
      'Ajay Maurya',
      'https://4thpointer.com',
      'ajay@4thpointer.com',
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT',
    )
    .addBearerAuth()        // Enable JWT authentication in Swagger
    .addTag('Products')
    .addTag('Product Variants')
    .addTag('Media')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Serve Swagger UI at /api-docs
  SwaggerModule.setup('api-docs', app, document);
  // Start server
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
