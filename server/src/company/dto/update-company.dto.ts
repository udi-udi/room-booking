import { IsString, IsNotEmpty, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string | null

  @ApiPropertyOptional({ example: '#5C6BC0' })
  @IsString()
  @IsOptional()
  color?: string
}
