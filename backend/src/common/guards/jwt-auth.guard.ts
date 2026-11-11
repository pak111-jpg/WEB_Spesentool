import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Kein Bearer-Token mitgeschickt');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
        rolle: AuthUser['rolle'];
      }>(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        rolle: payload.rolle,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token ungültig oder abgelaufen');
    }
  }
}
