import { IsOptional, IsString, IsEnum, MinLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsString()
  @IsOptional()
  firstName?: string

  @ApiPropertyOptional({ example: 'Smith' })
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiPropertyOptional({ enum: ['user', 'super_user', 'admin'] })
  @IsEnum({ user: 'user', super_user: 'super_user', admin: 'admin' })
  @IsOptional()
  role?: 'user' | 'super_user' | 'admin'

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string
}
