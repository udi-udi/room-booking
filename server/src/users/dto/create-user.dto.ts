import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiPropertyOptional({ enum: ['user', 'super_user', 'admin'] })
  @IsEnum({ user: 'user', super_user: 'super_user', admin: 'admin' })
  @IsOptional()
  role?: 'user' | 'super_user' | 'admin'
}
