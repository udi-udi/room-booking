import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateRoomDto {
  @ApiProperty({ example: 'Conference Room A' })
  @IsString()
  @IsNotEmpty()
  name: string
}
