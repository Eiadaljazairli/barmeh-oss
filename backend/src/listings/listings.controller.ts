import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserAwareCacheInterceptor } from '../common/interceptors/user-aware-cache.interceptor';
import type { AuthRequest } from '../auth/auth.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListingQueryDto } from './dto/listing-query.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('admin/count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get total listings count' })
  @ApiResponse({
    status: 200,
    description: 'Total count returned successfully',
  })
  async getCount() {
    const count = await this.listingsService.countAll();
    return { count };
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    const takeNum = Math.min(
      Math.max(parseInt(take ?? '200', 10) || 200, 1),
      200,
    );
    const skipNum = Math.max(parseInt(skip ?? '0', 10) || 0, 0);
    return this.listingsService.findAllAdmin(takeNum, skipNum);
  }

  @Get('admin/stats/city')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getCityStats() {
    return this.listingsService.getStatsByCity();
  }

  @Get('admin/stats/daily')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getDailyStats() {
    return this.listingsService.getStatsByDay();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new marketplace listing' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or AI moderation failed',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Request() req: AuthRequest, @Body() dto: CreateListingDto) {
    return this.listingsService.create(dto, req.user.sub);
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Param('id') id: string,
    @Body() dto: Partial<CreateListingDto>,
    @Request() req: AuthRequest,
  ) {
    return this.listingsService.update(id, dto, req.user.sub, req.user.isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updatePatch(
    @Param('id') id: string,
    @Body() dto: Partial<CreateListingDto>,
    @Request() req: AuthRequest,
  ) {
    return this.listingsService.update(id, dto, req.user.sub, req.user.isAdmin);
  }

  @Get('autocomplete')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10000)
  @ApiOperation({ summary: 'Autocomplete listing titles' })
  async autocomplete(@Query('q') query: string) {
    if (!query) return [];
    return this.listingsService.autocomplete(query);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(UserAwareCacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({ summary: 'Find all listings with search and filters' })
  findAll(@Request() req: any, @Query() queryDto: ListingQueryDto) {
    let parsedAttributes: Record<string, string> | undefined;
    if (queryDto.attributes) {
      try {
        const parsed = JSON.parse(queryDto.attributes);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedAttributes = parsed;
        }
      } catch {}
    }

    return this.listingsService.findAll(
      queryDto.q,
      queryDto.city,
      queryDto.categoryId,
      queryDto.minPrice,
      queryDto.maxPrice,
      queryDto.cursor,
      queryDto.limit,
      queryDto.lat,
      queryDto.lng,
      queryDto.distance,
      queryDto.priceStatus,
      req.user?.sub,
      parsedAttributes,
      queryDto.sortBy,
      queryDto.condition,
    );
  }

  @Get('favorites/me')
  @UseGuards(JwtAuthGuard)
  getFavorites(@Request() req: AuthRequest) {
    return this.listingsService.getFavorites(req.user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyListings(@Request() req: AuthRequest) {
    return this.listingsService.findByUser(req.user.sub);
  }

  @Get('purchases/me')
  @UseGuards(JwtAuthGuard)
  getPurchases(@Request() req: AuthRequest) {
    return this.listingsService.getPurchases(req.user.sub);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10000)
  @ApiOperation({ summary: 'Get details of a specific listing' })
  @ApiResponse({ status: 200, description: 'Listing details returned' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Get(':id/contact')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  getContact(@Param('id') id: string) {
    return this.listingsService.getContact(id);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  getListingsByUser(@Request() req: any, @Param('userId') userId: string) {
    return this.listingsService.findByUser(userId, req.user?.sub);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 3600_000 } })
  report(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.listingsService.report(id, req.user.sub, reason);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  favorite(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.toggleFavorite(id, req.user.sub);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  purchase(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.togglePurchase(id, req.user.sub);
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.remove(id, req.user.sub, req.user.isAdmin);
  }

  @Post(':id/book')
  @UseGuards(JwtAuthGuard)
  book(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.book(id, req.user.sub);
  }

  @Get('bookings/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my bookings (as requester)' })
  getMyBookings(@Request() req: AuthRequest) {
    return this.listingsService.getMyBookings(req.user.sub);
  }

  @Get(':id/my-booking')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'My active booking for a listing (or null)' })
  getMyBookingForListing(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.getMyBookingForListing(id, req.user.sub);
  }

  @Post('bookings/:bookingId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Requester cancels their booking' })
  cancelBooking(
    @Request() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.listingsService.cancelBooking(bookingId, req.user.sub);
  }

  @Get('bookings/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get a single booking request (requester or seller)',
  })
  getBooking(
    @Request() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.listingsService.getBooking(bookingId, req.user.sub);
  }

  @Post('bookings/:bookingId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Seller accepts a booking request' })
  acceptBooking(
    @Request() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.listingsService.respondToBooking(bookingId, req.user.sub, true);
  }

  @Post('bookings/:bookingId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Seller rejects a booking request' })
  rejectBooking(
    @Request() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.listingsService.respondToBooking(
      bookingId,
      req.user.sub,
      false,
    );
  }

  @Post(':id/bump')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @ApiOperation({
    summary: 'Bump listing to top of feed (allowed once per 7 days)',
  })
  bump(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.bump(id, req.user.sub);
  }

  @Post(':id/reserve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark listing as RESERVED (owner only)' })
  reserve(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.setReserved(id, req.user.sub);
  }

  @Post(':id/unreserve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Move listing from RESERVED back to ACTIVE (owner only)',
  })
  unreserve(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.listingsService.setActive(id, req.user.sub);
  }
}
