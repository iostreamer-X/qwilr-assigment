import { Module } from '@nestjs/common';
import { RootService } from './root.service';
import { RootController } from './root.controller';
import { UserModule } from '../user/user.module';
import { BalanceModule } from '../balance/balance.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [UserModule, BalanceModule, PortfolioModule, StocksModule],
  controllers: [RootController],
  providers: [RootService],
})
export class RootModule {}
