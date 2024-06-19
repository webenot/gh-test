import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { configDotenv } from 'dotenv';

configDotenv();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    { logger: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'], cors: true },
  );
  await app.listen(+process.env.PORT);
}

bootstrap();
