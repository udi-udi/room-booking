import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { RoomsService } from './rooms.service.js'
import { CreateRoomDto } from './dto/create-room.dto.js'
import { UpdateRoomDto } from './dto/update-room.dto.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'

interface AuthUser {
  id: string
  role: string
  companyId: string
}

@ApiTags('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('locations/:locationId/rooms')
  @ApiOperation({ summary: 'Get rooms for a location' })
  async findByLocation(@Param('locationId') locationId: string) {
    const rooms = await this.roomsService.findByLocation(locationId)
    return rooms
  }

  @Post('locations/:locationId/rooms')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Create a room in a location' })
  async create(
    @Param('locationId') locationId: string,
    @Body() dto: CreateRoomDto,
    @Request() req: { user: AuthUser },
  ) {
    const room = await this.roomsService.create(
      locationId,
      dto,
      req.user.companyId,
      req.user.role,
    )
    return room
  }

  @Put('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Update a room' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @Request() req: { user: AuthUser },
  ) {
    const room = await this.roomsService.update(
      id,
      dto,
      req.user.companyId,
      req.user.role,
    )
    return room
  }

  @Delete('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Delete a room' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    await this.roomsService.remove(id, req.user.companyId, req.user.role)
    return { message: 'Room deleted' }
  }
}
