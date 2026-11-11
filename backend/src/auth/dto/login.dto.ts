import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'anna.meier@firma.ch' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'passwort', minLength: 4 })
  @IsString()
  @MinLength(4)
  passwort: string;
}
