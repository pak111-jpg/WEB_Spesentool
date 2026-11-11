import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rolle } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Rollen } from './roles.decorator';

/**
 * Schützt einen Controller oder Endpunkt mit JWT und optional mit Rollen
 * und dokumentiert das gleich in Swagger mit.
 */
export function Auth(...rollen: Rolle[]) {
  return applyDecorators(
    Rollen(...rollen),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Nicht angemeldet oder Token ungültig',
    }),
    ApiForbiddenResponse({
      description: 'Rolle hat keinen Zugriff auf diesen Endpunkt',
    }),
  );
}
