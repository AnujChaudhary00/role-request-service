import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAccessRequestDto {
  @ApiProperty({ example: 'uuid-of-role', description: 'Role ID from role-service' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({ example: 'I need admin access for project X' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
