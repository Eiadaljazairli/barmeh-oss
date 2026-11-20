import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('Categories')
@Controller('categories')
@UseInterceptors(CacheInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAllCategories() {
    return this.categoriesService.findAll();
  }

  @Get(':id/children')
  getChildren(@Param('id') categoryId: string) {
    return this.categoriesService.getChildCategories(categoryId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(
    @Body()
    data: {
      nameAr: string;
      nameEn: string;
      slug: string;
      icon?: string;
      parentId?: string;
      order?: number;
    },
  ) {
    return this.categoriesService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body()
    data: {
      nameAr?: string;
      nameEn?: string;
      slug?: string;
      icon?: string;
      parentId?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
