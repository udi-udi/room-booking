import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateLocationDto {
  @ApiProperty({ example: 'Main Office' })
  @IsString()
  @IsNotEmpty()
  name: string
}
