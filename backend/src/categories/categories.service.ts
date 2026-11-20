import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { listings: { where: { status: 'ACTIVE' } } },
        },
      },
    });
  }

  async findOneBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  async getChildCategories(parentId: string) {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException(`الفئة برقم ${parentId} غير موجودة`);
    }

    return this.prisma.category.findMany({
      where: { parentId, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { listings: { where: { status: 'ACTIVE' } } },
        },
      },
    });
  }

  async create(data: {
    nameAr: string;
    nameEn: string;
    slug: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }) {
    const category = await this.prisma.category.create({
      data: {
        ...data,
        isActive: true,
      },
    });
    this.eventEmitter.emit('category.updated', category);
    return category;
  }

  async update(
    id: string,
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
    const category = await this.prisma.category.update({
      where: { id },
      data,
    });
    this.eventEmitter.emit('category.updated', category);
    return category;
  }

  async remove(id: string) {
    const category = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    this.eventEmitter.emit('category.updated', category);
    return category;
  }
}
