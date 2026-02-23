import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { users: true, locations: true } },
      },
    })
    if (!company) throw new NotFoundException('Company not found')
    return company
  }

  async update(companyId: string, data: { name: string; logo?: string | null; color?: string }, requestRole: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Company not found')

    if (requestRole !== 'admin' && company.id !== companyId) {
      throw new ForbiddenException('Cannot update another company')
    }

    const updateData: { name: string; logo?: string | null; color?: string } = { name: data.name }
    if (data.logo !== undefined) {
      updateData.logo = data.logo
    }
    if (data.color !== undefined) {
      updateData.color = data.color
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
        _count: { select: { users: true, locations: true } },
      },
    })
  }

  async create(name: string) {
    return this.prisma.company.create({
      data: { name },
      include: {
        _count: { select: { users: true, locations: true } },
      },
    })
  }

  async remove(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Company not found')
    return this.prisma.company.delete({ where: { id: companyId } })
  }
}
