import { IsArray, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AssignLocationsDto {
  @ApiProperty({ type: [String], example: ['location-uuid-1', 'location-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  locationIds: string[]
}
