import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [BalanceModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
  controllers: [PortfolioController]
})
export class PortfolioModule {}
