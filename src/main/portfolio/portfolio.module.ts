import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { BalanceModule } from '../balance/balance.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [BalanceModule, StocksModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
  controllers: [PortfolioController]
})
export class PortfolioModule {}
