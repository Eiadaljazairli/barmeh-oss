import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { City } from '@prisma/client';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({
    example: 'iPhone 15 Pro Max',
    description: 'The title of the listing',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example:
      'A brand new iPhone 15 Pro Max with 256GB storage, original box and accessories.',
    description: 'Detailed description of the item',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 1200.5, description: 'Price in SYP or USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'Negotiable',
    description: 'Price status (Fixed, Negotiable, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  priceStatus: string;

  @ApiProperty({
    enum: City,
    example: City.DAMASCUS,
    description: 'City where the item is located',
  })
  @IsEnum(City)
  @IsNotEmpty()
  city: City;

  @ApiProperty({
    example: 'cat_electronics_123',
    description: 'ID of the category',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  discount?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 33.5138 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.2765 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: { color: 'Black', storage: '256GB' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}
