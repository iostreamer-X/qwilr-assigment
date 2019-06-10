import { Module } from '@nestjs/common';
import { UserAuthenticationMiddleware } from './user-authentication/user-authentication.middleware';

@Module({
	providers: [UserAuthenticationMiddleware]
})
export class MiddlewareModule {}
