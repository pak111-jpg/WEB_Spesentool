import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UserDto } from './dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await compare(dto.passwort, user.passwortHash))) {
      throw new UnauthorizedException('E-Mail oder Passwort falsch');
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      rolle: user.rolle,
    });
    return { accessToken, user: toUserDto(user) };
  }

  async me(userId: number): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }
    return toUserDto(user);
  }
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    personalnummer: user.personalnummer,
    email: user.email,
    name: user.name,
    rolle: user.rolle,
    kostenstelle: user.kostenstelle,
    vorgesetzteId: user.vorgesetzteId,
  };
}
