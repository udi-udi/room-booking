import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { GoogleAuthGuard } from './guards/google-auth.guard.js'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    const tokens = await this.authService.register(dto)
    return tokens
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.login(dto)
    return tokens
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (client-side token removal)' })
  logout() {
    return { message: 'Logged out' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: { user: { id: string } }) {
    const user = await this.authService.getProfile(req.user.id)
    return user
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (name, color)' })
  async updateMyProfile(
    @Request() req: { user: { id: string } },
    @Body() body: { firstName?: string; lastName?: string; color?: string; weekStartDay?: number },
  ) {
    return this.authService.updateMyProfile(req.user.id, body)
  }

  @Put('me/set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force change password (clears mustChangePassword flag)' })
  async forceChangePassword(
    @Request() req: { user: { id: string } },
    @Body() body: { newPassword: string },
  ) {
    await this.authService.forceChangePassword(req.user.id, body.newPassword)
    return { message: 'Password changed successfully' }
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword)
    return { message: 'Password changed successfully' }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshTokens(refreshToken)
    return tokens
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(
    @Request() req: { user: { email: string; firstName: string; lastName: string } },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.googleLogin(req.user)
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
    res.redirect(`http://localhost:5173/login?${params.toString()}`)
  }
}
