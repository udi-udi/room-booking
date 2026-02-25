import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { UsersService } from './users.service.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { AssignLocationsDto } from './dto/assign-locations.dto.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'

interface AuthUser {
  id: string
  role: string
  companyId: string
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_user', 'admin')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in company' })
  async findAll(
    @Request() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
  ) {
    const users = await this.usersService.findAll(req.user.companyId, req.user.role, companyId)
    return users
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user' })
  async invite(
    @Body() dto: CreateUserDto & { companyId?: string },
    @Request() req: { user: AuthUser },
    @Headers('origin') origin: string,
  ) {
    // Admin can invite to a specific company; super_user always invites to own company
    const targetCompanyId = req.user.role === 'admin' && dto.companyId ? dto.companyId : req.user.companyId
    const user = await this.usersService.invite(dto, targetCompanyId, origin)
    return user
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: AuthUser },
  ) {
    const user = await this.usersService.update(id, dto, req.user.companyId, req.user.role)
    return user
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a user' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    await this.usersService.remove(id, req.user.id, req.user.companyId, req.user.role)
    return { message: 'User deleted' }
  }

  @Put(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password (generates OTP, forces change on next login)' })
  async resetPassword(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
    @Headers('origin') origin: string,
  ) {
    return this.usersService.resetPassword(id, req.user.companyId, req.user.role, origin)
  }

  @Put(':id/locations')
  @ApiOperation({ summary: 'Assign locations to a user' })
  async assignLocations(
    @Param('id') id: string,
    @Body() dto: AssignLocationsDto,
    @Request() req: { user: AuthUser },
  ) {
    const user = await this.usersService.assignLocations(
      id,
      dto.locationIds,
      req.user.companyId,
      req.user.role,
    )
    return user
  }
}
