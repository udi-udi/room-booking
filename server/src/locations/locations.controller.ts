import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { LocationsService } from './locations.service.js'
import { CreateLocationDto } from './dto/create-location.dto.js'
import { UpdateLocationDto } from './dto/update-location.dto.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'

interface AuthUser {
  id: string
  role: string
  companyId: string
}

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user's accessible locations" })
  async findAll(
    @Request() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
  ) {
    // Admin can filter by a specific company
    const targetCompanyId = req.user.role === 'admin' && companyId ? companyId : req.user.companyId
    const locations = await this.locationsService.findAllForUser(
      req.user.id,
      req.user.role,
      targetCompanyId,
    )
    return locations
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Create a new location' })
  async create(
    @Body() dto: CreateLocationDto & { companyId?: string },
    @Request() req: { user: AuthUser },
  ) {
    const targetCompanyId = req.user.role === 'admin' && dto.companyId ? dto.companyId : req.user.companyId
    const location = await this.locationsService.create(dto, targetCompanyId)
    return location
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Update a location' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @Request() req: { user: AuthUser },
  ) {
    const location = await this.locationsService.update(
      id,
      dto,
      req.user.companyId,
      req.user.role,
    )
    return location
  }

  @Get(':id/users')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Get users assigned to a location' })
  async getLocationUsers(@Param('id') id: string) {
    return this.locationsService.getLocationUsers(id)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_user', 'admin')
  @ApiOperation({ summary: 'Delete a location' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    await this.locationsService.remove(id, req.user.companyId, req.user.role)
    return { message: 'Location deleted' }
  }
}
