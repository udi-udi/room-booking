import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AdminService } from './admin.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { UpdateCompanyDto } from '../company/dto/update-company.dto.js'

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('companies')
  @ApiOperation({ summary: 'List all companies (admin only)' })
  async findAllCompanies() {
    const data = await this.adminService.findAllCompanies()
    return data
  }

  @Post('companies')
  @ApiOperation({ summary: 'Create a new company (admin only)' })
  async createCompany(@Body() dto: UpdateCompanyDto) {
    const data = await this.adminService.createCompany(dto.name)
    return data
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete a company and all its data (admin only)' })
  async deleteCompany(@Param('id') id: string) {
    await this.adminService.deleteCompany(id)
    return { message: 'Company and all associated data deleted' }
  }

  @Get('companies/:id/users')
  @ApiOperation({ summary: 'List users in a specific company (admin only)' })
  async getCompanyUsers(@Param('id') id: string) {
    const data = await this.adminService.getCompanyUsers(id)
    return data
  }

  @Delete('bookings/:id')
  @ApiOperation({ summary: 'Delete any booking (admin only)' })
  async deleteBooking(@Param('id') id: string) {
    await this.adminService.deleteBooking(id)
    return { message: 'Booking deleted' }
  }
}
