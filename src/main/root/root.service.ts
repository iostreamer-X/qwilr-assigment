import { Injectable } from '@nestjs/common';
import { BalanceService } from '../balance/balance.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { StocksService } from '../stocks/stocks.service';

@Injectable()
export class RootService {
    constructor(
        readonly balanceService: BalanceService,
        readonly portfolioService: PortfolioService,
        readonly stocksService: StocksService
    ) {

    }

    async getAppData(user: any) {
        const balance = await this.balanceService.getBalance(user);
        const stockData = await this.stocksService.getStockData();

        return {
            stockData,
            balance
        }
    }

    async renderApp(user, res) {
        const appData = await this.getAppData(user);
        res.render('app', { stockData: appData.stockData, balance: appData.balance });
    }

    async renderIndex(res) {
        res.render('index');
    }

}
