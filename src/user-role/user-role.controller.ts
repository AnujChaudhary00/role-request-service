import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRoleService } from './user-role.service';

@ApiBearerAuth()
@ApiTags('User Roles')
@UseGuards(JwtGuard)
@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly service: UserRoleService) {}

  @ApiOperation({ summary: 'Get all user-role assignments (admin)' })
  @ApiOkResponse({ description: 'All granted roles' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get my assigned roles' })
  @Get('my')
  findMine(@Req() req: Request) {
    return this.service.findByUser(req['user'].sub);
  }

  @ApiOperation({ summary: 'Get roles assigned to a specific user' })
  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @ApiOperation({ summary: 'Revoke a role assignment by entry ID' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.service.revoke(id);
  }
}
