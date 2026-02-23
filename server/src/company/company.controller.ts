import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CompanyService } from './company.service.js'
import { UpdateCompanyDto } from './dto/update-company.dto.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'

interface AuthUser {
  id: string
  role: string
  companyId: string
}

@ApiTags('company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_user', 'admin')
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get company details' })
  async findOne(
    @Request() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
  ) {
    const targetId = req.user.role === 'admin' && companyId ? companyId : req.user.companyId
    const data = await this.companyService.findOne(targetId)
    return data
  }

  @Put()
  @ApiOperation({ summary: 'Update company name' })
  async update(
    @Body() dto: UpdateCompanyDto & { companyId?: string },
    @Request() req: { user: AuthUser },
  ) {
    const targetId = req.user.role === 'admin' && dto.companyId ? dto.companyId : req.user.companyId
    const data = await this.companyService.update(targetId, { name: dto.name, logo: dto.logo, color: dto.color }, req.user.role)
    return data
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new company (admin only)' })
  async create(@Body() dto: UpdateCompanyDto) {
    const data = await this.companyService.create(dto.name)
    return data
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a company (admin only)' })
  async remove(@Param('id') id: string) {
    await this.companyService.remove(id)
    return { message: 'Company deleted' }
  }
}
