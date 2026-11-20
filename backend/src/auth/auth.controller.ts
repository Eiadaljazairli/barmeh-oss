import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RequestEmailOtpDto,
  VerifyOtpDto,
  AdminLoginDto,
  SocialLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-email-otp')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async requestEmailOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestEmailOtp(dto);
  }

  @Post('pre-verify-email')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  preVerifyEmail(@Body() dto: { email: string; otp: string }) {
    return this.authService.preVerifyEmailOtp(dto.email, dto.otp);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete registration or login' })
  @ApiResponse({ status: 200, description: 'Token issued successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('google-login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  googleLogin(@Body() dto: SocialLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  passwordLogin(@Body() dto: AdminLoginDto) {
    return this.authService.passwordLogin(dto.email, dto.password);
  }

  @Post('verify-2fa')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  verify2fa(@Body() dto: { userId: string; code: string }) {
    return this.authService.verify2fa(dto.userId, dto.code);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
