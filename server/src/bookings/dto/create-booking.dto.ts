import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBookingDto {
  @ApiProperty({ example: 'room-uuid-here' })
  @IsString()
  @IsNotEmpty()
  roomId: string

  @ApiProperty({ example: '2026-03-01T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly'] })
  @IsEnum({ daily: 'daily', weekly: 'weekly', monthly: 'monthly' })
  @IsOptional()
  recurrencePattern?: 'daily' | 'weekly' | 'monthly'

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  recurrenceEndDate?: string

  @ApiPropertyOptional({ description: 'User ID to book on behalf of (super_user/admin only)' })
  @IsString()
  @IsOptional()
  userId?: string
}
