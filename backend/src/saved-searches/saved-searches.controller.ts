import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth.types';

@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  async create(
    @Request() req: AuthRequest,
    @Body() body: { query?: string; filters: any },
  ) {
    return this.savedSearchesService.create(req.user.sub, body);
  }

  @Get()
  async findAll(@Request() req: AuthRequest) {
    return this.savedSearchesService.findAll(req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.savedSearchesService.remove(req.user.sub, id);
  }
}
