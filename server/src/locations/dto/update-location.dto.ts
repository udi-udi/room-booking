import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateLocationDto {
  @ApiProperty({ example: 'Updated Office Name' })
  @IsString()
  @IsNotEmpty()
  name: string
}
