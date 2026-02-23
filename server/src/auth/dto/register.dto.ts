import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ example: 'mySecurePass1' })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty({ example: 'My Company' })
  @IsString()
  @IsNotEmpty()
  companyName: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyId?: string
}
