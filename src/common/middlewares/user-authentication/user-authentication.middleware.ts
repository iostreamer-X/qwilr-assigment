import { Injectable, MiddlewareFunction, NestMiddleware, HttpStatus } from '@nestjs/common';
import { WrongAuthentication } from '../../dto/WrongAuthentication';
import { UserService } from '../../../main/user/user.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../../../main/config/config.service';

@Injectable()
export class UserAuthenticationMiddleware implements NestMiddleware {
	constructor(
		readonly configService: ConfigService,
		readonly userService: UserService,
	) {

	}
	resolve(): MiddlewareFunction {
		return async (req, res, next) => {
			try {
				const token = req.header('token');
				const payload: any = jwt.verify(token, this.configService.getJWTSecretKey());
				if (!payload) {
					throw new WrongAuthentication('Invalid token!');
				}
				const user = await this.userService.getUser(payload.email);
				req.user = user;
				if (next) {
					next();
				}
			} catch (error) {
				console.log(error);
				throw new WrongAuthentication('Invalid token!');
			}
		};
	}
}
