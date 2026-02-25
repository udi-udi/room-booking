import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { LocationsModule } from './locations/locations.module'
import { RoomsModule } from './rooms/rooms.module'
import { BookingsModule } from './bookings/bookings.module'
import { UsersModule } from './users/users.module'
import { CompanyModule } from './company/company.module'
import { AdminModule } from './admin/admin.module'
import { MailModule } from './mail/mail.module'
import { LoggerMiddleware } from './common/middleware/logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
    PrismaModule,
    AuthModule,
    LocationsModule,
    RoomsModule,
    BookingsModule,
    UsersModule,
    CompanyModule,
    AdminModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
