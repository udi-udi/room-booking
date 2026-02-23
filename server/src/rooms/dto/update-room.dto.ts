import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateRoomDto {
  @ApiProperty({ example: 'Updated Room Name' })
  @IsString()
  @IsNotEmpty()
  name: string
}
