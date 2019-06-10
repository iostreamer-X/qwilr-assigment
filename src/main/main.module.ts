import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { BalanceModule } from './balance/balance.module';
import { UserAuthenticationMiddleware } from '../common/middlewares/user-authentication/user-authentication.middleware';
import { BalanceController } from './balance/balance.controller';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PortfolioController } from './portfolio/portfolio.controller';

@Module({
	imports: [UserModule, DatabaseModule, ConfigModule, BalanceModule, PortfolioModule]
})
export class MainModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
		.apply(UserAuthenticationMiddleware)
		.forRoutes(
			BalanceController,
			PortfolioController
		);
	}
}
