import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SqsService } from '../sqs/sqs.service.js';
import { CreateAccessRequestDto } from './dto/create-access-request.dto.js';
import { ResolveRequestDto } from './dto/resolve-request.dto.js';

@Injectable()
export class AccessRequestService {
  private readonly logger = new Logger(AccessRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sqs: SqsService,
  ) {}

  async create(userId: string, dto: CreateAccessRequestDto) {
    const existing = await this.prisma.accessRequest.findFirst({
      where: { userId, roleId: dto.roleId, status: RequestStatus.PENDING },
    });
    if (existing) throw new ConflictException('A pending request for this role already exists');

    const request = await this.prisma.accessRequest.create({
      data: { userId, roleId: dto.roleId, comment: dto.comment },
    });

    this.sqs.publish({
      accessRequestId: request.id,
      userId: request.userId,
      roleId: request.roleId,
      status: 'PENDING',
      comment: request.comment ?? undefined,
      requestedAt: request.requestedAt.toISOString(),
    }).catch(err => this.logger.error(`SQS publish failed for new request ${request.id}`, err));

    return request;
  }

  findAll() {
    return this.prisma.accessRequest.findMany({ orderBy: { requestedAt: 'desc' } });
  }

  findByUser(userId: string) {
    return this.prisma.accessRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.accessRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Request ${id} not found`);
    return req;
  }

  async approve(id: string, adminId: string, dto: ResolveRequestDto) {
    const req = await this.findOne(id);
    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${req.status.toLowerCase()}`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.accessRequest.update({
        where: { id },
        data: {
          status: RequestStatus.APPROVED,
          resolvedBy: adminId,
          resolvedAt: new Date(),
          comment: dto.comment ?? req.comment,
        },
      }),
      this.prisma.userHasRole.upsert({
        where: { userId_roleId: { userId: req.userId, roleId: req.roleId } },
        create: { userId: req.userId, roleId: req.roleId, grantedBy: adminId },
        update: { grantedBy: adminId, grantedAt: new Date() },
      }),
    ]);

    this.sqs.publish({
      accessRequestId: updated.id,
      userId: updated.userId,
      roleId: updated.roleId,
      status: 'APPROVED',
      comment: updated.comment ?? undefined,
      resolvedAt: updated.resolvedAt?.toISOString(),
      requestedAt: updated.requestedAt.toISOString(),
    }).catch(err => this.logger.error(`SQS publish failed for approved request ${updated.id}`, err));

    return updated;
  }

  async reject(id: string, adminId: string, dto: ResolveRequestDto) {
    const req = await this.findOne(id);
    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${req.status.toLowerCase()}`);
    }

    const updated = await this.prisma.accessRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        comment: dto.comment ?? req.comment,
      },
    });

    this.sqs.publish({
      accessRequestId: updated.id,
      userId: updated.userId,
      roleId: updated.roleId,
      status: 'REJECTED',
      comment: updated.comment ?? undefined,
      resolvedAt: updated.resolvedAt?.toISOString(),
      requestedAt: updated.requestedAt.toISOString(),
    }).catch(err => this.logger.error(`SQS publish failed for rejected request ${updated.id}`, err));

    return updated;
  }

  async cancel(id: string, userId: string) {
    const req = await this.findOne(id);
    if (req.userId !== userId) throw new BadRequestException('You can only cancel your own requests');
    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a ${req.status.toLowerCase()} request`);
    }

    const deleted = await this.prisma.accessRequest.delete({ where: { id } });

    this.sqs.publish({
      accessRequestId: req.id,
      userId: req.userId,
      roleId: req.roleId,
      status: 'CANCELLED',
      comment: req.comment ?? undefined,
      requestedAt: req.requestedAt.toISOString(),
    }).catch(err => this.logger.error(`SQS publish failed for cancelled request ${req.id}`, err));

    return deleted;
  }
}
