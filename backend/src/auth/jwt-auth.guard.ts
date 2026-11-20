import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from './sessions.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('لم يتم العثور على توثيق (Token)');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.jti) {
        const session = await this.sessionsService.findActiveByJti(payload.jti);
        if (!session) {
          throw new UnauthorizedException(
            'تم إلغاء صلاحية هذا التوكن، يرجى تسجيل الدخول مجدداً',
          );
        }
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isBlocked: true, isDeleted: true },
      });

      if (!user || user.isDeleted) {
        throw new ForbiddenException('هذا الحساب معطل أو تم حذفه');
      }

      request['user'] = payload;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('صلاحية التوثيق منتهية أو غير صحيحة');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
