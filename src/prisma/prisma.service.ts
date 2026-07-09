import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const rawUrl = process.env.DATABASE_URL!;
    const url = new URL(rawUrl);
    const schema = url.searchParams.get('schema') ?? 'public';
    url.searchParams.delete('schema');

    const pool = new Pool({
      connectionString: url.toString(),
      options: `-c search_path=${schema}`,
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
