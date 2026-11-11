import { SetMetadata } from '@nestjs/common';
import { Rolle } from '../../generated/prisma/enums';

export const ROLES_KEY = 'rollen';

/** Beschränkt einen Endpunkt auf die angegebenen Rollen. */
export const Rollen = (...rollen: Rolle[]) => SetMetadata(ROLES_KEY, rollen);
