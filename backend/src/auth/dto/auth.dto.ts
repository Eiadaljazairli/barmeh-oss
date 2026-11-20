import {
  IsString,
  Matches,
  Length,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Gender, UserType, City } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestEmailOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLogin?: boolean;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code received via SMS or Email',
  })
  @IsString()
  @Length(4, 6, { message: 'رمز التحقق يجب أن يكون بين 4 و 6 خانات' })
  otp: string;

  @ApiPropertyOptional({ example: 'Ahmad' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'الاسم الأول يجب أن يكون بين 2 و 50 حرفاً' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Barmeh' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'الكنية يجب أن تكون بين 2 و 50 حرفاً' })
  lastName?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt({ message: 'العمر يجب أن يكون رقماً' })
  @Min(18, { message: 'يجب أن يكون العمر 18 سنة على الأقل' })
  @Max(100, { message: 'العمر غير منطقي' })
  age?: number;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender, { message: 'الجنس غير صالح' })
  gender?: Gender;

  @ApiPropertyOptional({ enum: City, example: City.DAMASCUS })
  @IsOptional()
  @IsEnum(City, { message: 'المحافظة غير صالحة' })
  governorate?: City;

  @ApiPropertyOptional({ enum: UserType, example: UserType.CONSUMER })
  @IsOptional()
  @IsEnum(UserType, { message: 'نوع المستخدم غير صالح' })
  userType?: UserType;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'Only required for registration',
  })
  @IsOptional()
  @IsString()
  @Length(8, 50, {
    message: 'كلمة المرور يجب أن تكون 8 خانات على الأقل وتتكون من أرقام وحروف',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
    message: 'كلمة المرور يجب أن تحتوي على حروف وأرقام',
  })
  password?: string;

  @ApiPropertyOptional({ example: 'متجر الامل' })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional({ example: 'دمشق' })
  @IsOptional()
  @IsString()
  storeAddress?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 خانات' })
  otp: string;

  @ApiProperty({ example: 'NewPass123' })
  @IsString()
  @Length(8, 50, {
    message: 'كلمة المرور يجب أن تكون 8 خانات على الأقل وتتكون من أرقام وحروف',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
    message: 'كلمة المرور يجب أن تحتوي على حروف وأرقام',
  })
  newPassword: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiProperty({ example: 'adminPass123' })
  @IsString()
  @Length(6, 50, { message: 'كلمة المرور يجب أن تكون 6 خانات على الأقل' })
  password: string;
}

export class SocialLoginDto {
  @ApiProperty({ description: 'Google ID Token' })
  @IsString()
  idToken: string;
}
