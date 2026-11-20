import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { City, PriceStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  LATEST = 'LATEST',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  POPULAR = 'POPULAR',
}

export enum Condition {
  ALL = 'ALL',
  NEW = 'NEW',
  USED = 'USED',
}

export class ListingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: City })
  @IsOptional()
  @IsEnum(City)
  city?: City;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({ enum: PriceStatus })
  @IsOptional()
  @IsEnum(PriceStatus)
  priceStatus?: PriceStatus;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortBy?: SortOrder;

  @ApiPropertyOptional({ enum: Condition })
  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Dynamic attribute filters as JSON string',
  })
  @IsOptional()
  @IsString()
  attributes?: string;
}
