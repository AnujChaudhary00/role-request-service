import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AccessRequestService } from './access-request.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';

@ApiBearerAuth()
@ApiTags('Access Requests')
@UseGuards(JwtGuard)
@Controller('access-requests')
export class AccessRequestController {
  constructor(private readonly service: AccessRequestService) {}

  @ApiOperation({ summary: 'Create a role access request (userId from JWT)' })
  @ApiCreatedResponse({ description: 'Request created with PENDING status' })
  @Post()
  create(@Req() req: Request, @Body() dto: CreateAccessRequestDto) {
    return this.service.create(req['user'].sub, dto);
  }

  @ApiOperation({ summary: 'Get all access requests (admin)' })
  @ApiOkResponse({ description: 'All requests ordered by date' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get my access requests' })
  @Get('my')
  findMine(@Req() req: Request) {
    return this.service.findByUser(req['user'].sub);
  }

  @ApiOperation({ summary: 'Get a specific request by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Approve a request — also grants the role to the user' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ResolveRequestDto,
  ) {
    return this.service.approve(id, req['user'].sub, dto);
  }

  @ApiOperation({ summary: 'Reject a request' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ResolveRequestDto,
  ) {
    return this.service.reject(id, req['user'].sub, dto);
  }

  @ApiOperation({ summary: 'Cancel my own pending request' })
  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: Request) {
    return this.service.cancel(id, req['user'].sub);
  }
}
