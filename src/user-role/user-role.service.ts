import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string) {
    return this.prisma.userHasRole.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.userHasRole.findMany({ orderBy: { grantedAt: 'desc' } });
  }

  async revoke(id: string) {
    const entry = await this.prisma.userHasRole.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException(`UserRole entry ${id} not found`);
    this.logger.log(`Revoking role ${entry.roleId} from user ${entry.userId}`);
    return this.prisma.userHasRole.delete({ where: { id } });
  }
}
