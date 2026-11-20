import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpgradeMerchantDto {
  @ApiProperty({ example: 'متجر الامل للالكترونيات' })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiPropertyOptional({ example: 'دمشق، شارع النصر' })
  @IsString()
  @IsOptional()
  storeAddress?: string;

  @ApiPropertyOptional({ example: '123-456-789' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: { monday: '9am-9pm' } })
  @IsObject()
  @IsOptional()
  businessHours?: any;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateMerchantProfileDto extends UpgradeMerchantDto {}
