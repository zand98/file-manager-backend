import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { UserService } from '../user/user.service';

/**
 * Jwt Strategy Class
 */
@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly configService: ConfigService,
    private readonly employeeService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: 'secret',
      secretOrKey: configService.get('WEBTOKEN_SECRET_KEY'),
    });
  }

  // jwt.strategy.ts
  async validate(payload: { sub: string; roles: string[] }) {
    return {
      id: payload.sub,
      roles: payload.roles, // Now just role names
    };
  }
}
