import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccessRequestModule } from './access-request/access-request.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { JwtGuard } from './auth/jwt.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SqsModule } from './sqs/sqs.module.js';
import { UserRoleModule } from './user-role/user-role.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({ secret: process.env.JWT_SECRET }),
    }),
    PrismaModule,
    SqsModule,
    AccessRequestModule,
    UserRoleModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtGuard, RolesGuard],
})
export class AppModule {}
