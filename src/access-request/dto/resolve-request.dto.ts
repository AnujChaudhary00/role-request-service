import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveRequestDto {
  @ApiPropertyOptional({ example: 'Approved — meets project requirements' })
  @IsOptional()
  @IsString()
  comment?: string;
}
