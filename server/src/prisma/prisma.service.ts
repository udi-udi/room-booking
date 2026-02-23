import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    try {
      await this.$connect()
      // Check if tables exist by querying a known table
      await this.$queryRaw`SELECT 1 FROM companies LIMIT 1`
      this.logger.log('Database tables verified')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('does not exist') || msg.includes('relation')) {
        this.logger.warn('Database tables not found — running migrations...')
        try {
          const schemaPath = join(__dirname, '..', '..', 'prisma', 'schema.prisma')
          execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
            stdio: 'inherit',
          })
          this.logger.log('Migrations applied successfully')
          await this.$connect()
        } catch (migrationError) {
          this.logger.error('Failed to run migrations', migrationError)
          throw migrationError
        }
      } else {
        throw error
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
