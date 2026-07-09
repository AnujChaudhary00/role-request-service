import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import serverlessExpress from '@vendia/serverless-express';
import type { Callback, Context, Handler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module.js';
import { loadSecrets } from './config/load-secrets.js';

function validateEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'SQS_QUEUE_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

let cachedHandler: Handler;

async function bootstrap(): Promise<Handler> {
  await loadSecrets();
  validateEnv();
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Role Request Service')
      .setDescription('API for requesting roles, approvals, and user role assignments')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);
  }

  await app.init();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: unknown, context: Context, callback: Callback) => {
  cachedHandler ??= await bootstrap();
  return cachedHandler(event as any, context, callback);
};
