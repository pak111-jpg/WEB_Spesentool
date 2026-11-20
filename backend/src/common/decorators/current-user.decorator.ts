import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rolle } from '../../generated/prisma/enums';

/** Nutzerdaten, die der JwtAuthGuard aus dem Token in den Request schreibt. */
export interface AuthUser {
  id: number;
  email: string;
  rolle: Rolle;
}

/** Parameter-Decorator: liefert die angemeldete Person aus dem JWT. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
