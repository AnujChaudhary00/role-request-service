import { Module } from '@nestjs/common';
import { AccessRequestController } from './access-request.controller.js';
import { AccessRequestService } from './access-request.service.js';

@Module({
  controllers: [AccessRequestController],
  providers: [AccessRequestService],
})
export class AccessRequestModule {}
