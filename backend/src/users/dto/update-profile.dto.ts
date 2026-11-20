import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { City, Gender, UserType } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 32, { message: 'اسم المستخدم يجب أن يكون بين 3 و 32 حرفاً' })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'اسم المستخدم يقبل أحرفاً إنجليزية صغيرة وأرقاماً و _ فقط',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'الاسم الأول يجب أن يكون بين 2 و 50 حرفاً' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'الكنية يجب أن تكون بين 2 و 50 حرفاً' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(8, 100, { message: 'كلمة السر يجب أن تكون 8 خانات على الأقل' })
  password?: string;

  @IsOptional()
  @IsInt({ message: 'العمر يجب أن يكون رقماً' })
  @Min(18, { message: 'يجب أن يكون العمر 18 سنة على الأقل' })
  @Max(95, { message: 'العمر غير منطقي' })
  age?: number;

  @IsOptional()
  @IsEnum(Gender, { message: 'الجنس غير صالح' })
  gender?: Gender;

  @IsOptional()
  @IsEnum(City, { message: 'المحافظة غير صالحة' })
  governorate?: City;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(UserType, { message: 'نوع الحساب غير صالح' })
  userType?: UserType;
}
