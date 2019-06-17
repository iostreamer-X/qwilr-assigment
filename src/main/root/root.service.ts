import { Injectable } from '@nestjs/common';
import { BalanceService } from '../balance/balance.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { StocksService } from '../stocks/stocks.service';
import { WrongInput } from '../../common/dto/WrongInput';

@Injectable()
export class RootService {
    constructor(
        readonly balanceService: BalanceService,
        readonly portfolioService: PortfolioService,
        readonly stocksService: StocksService
    ) {

    }

    async getAppData(user: any, name?: string) {
        const { balance } = await this.balanceService.getBalance(user);
        const stockData = await this.stocksService.getStockData(name);
        return {
            stockData,
            balance
        }
    }

    async renderApp(req, res) {
        const stockNameSearch = req.query.searchStock;
        if (stockNameSearch) {
            const stockResult = await this.stocksService.search(stockNameSearch);
            if (!stockResult || !stockResult.symbol) {
                throw new WrongInput('No such stock!');
            }

            await this.stocksService.addToMasterDataAndUpdate(stockNameSearch);
        }
        const appData = await this.getAppData(req.user, stockNameSearch);
        res.render('app', { stockData: appData.stockData, balance: `Current Balance: ${appData.balance}` });
    }

    async renderIndex(res) {
        res.render('index');
    }

    async renderPortfolio(user, res) {
        this.portfolioService.renderPortfolio(user, res);
    }

}
