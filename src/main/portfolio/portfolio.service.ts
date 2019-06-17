import { Injectable, Inject } from '@nestjs/common';
import { Constants } from '../../../lib/Constants';
import { Db, MongoClient } from 'mongodb';
import { BalanceService } from '../balance/balance.service';
import { BuyStocksDto } from './dto/buy-stocks.dto';
import { WrongInput } from '../../common/dto/WrongInput';
import * as lodash from 'lodash';
import { SellStocksDto } from './dto/sell-stocks.dto';
import { StocksService } from '../stocks/stocks.service';

@Injectable()
export class PortfolioService {
    constructor(
        @Inject(Constants.DATABASE_SERVICE) readonly db: Db,
        @Inject(Constants.CLIENT_SERVICE) readonly client: MongoClient,
        readonly balanceService: BalanceService,
        readonly stocksService: StocksService
    ) {
    }

    async sellStocks(user: any, dto: SellStocksDto) {
        const session = this.client.startSession();
        try {
            if (!user.stocks || !user.stocks[dto.name]) {
                throw new WrongInput(`You don't have that stock in your portfolio!`);
            }
    
            if (user.stocks[dto.name] < dto.quantity) {
                throw new WrongInput(`You don't have enough of that stock!`);
            }
            const stockData = await this.stocksService.getSingleStockData(dto.name);
            if (!stockData) {
                throw new WrongInput('Invalid Stock!');
            }
            const sellingPrice = dto.quantity * stockData.price;
            await this.balanceService.addBalance(user, { balance: sellingPrice }, { session });
            const userStockBalanceUpdateQueryObject = (_ => {
                if (user.stocks[dto.name] > dto.quantity) {
                    return {
                        $inc: {
                            [`stocks.${dto.name}`]: -dto.quantity
                        }
                    };
                }
                return {
                    $unset: {
                        [`stocks.${dto.name}`]: 1
                    }
                };
    
            })();
            await this.db.collection(Constants.USER_COLLECTION).updateOne({ email: user.email }, userStockBalanceUpdateQueryObject, { session });
            await session.commitTransaction();
        } catch (error) {
            try {
                await session.abortTransaction();
            } catch (error) {
                
            }
            throw error;
        }
    }

    async buyStocks(user: any, dto: BuyStocksDto) {
        const session = this.client.startSession();
        try {
            const stockData = await this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).findOne({ name: dto.name }, { session });
            if (!stockData) {
                throw new WrongInput('Invalid Stock!');
            }

            if (stockData.price === undefined) {
                throw new WrongInput('Stock price not available!');
            }

            const price = stockData.price * dto.quantity;
            await this.balanceService.removeBalance(user, price, session);

            this.db.collection(Constants.USER_COLLECTION).updateOne(
                { email: user.email },
                {
                    $inc: { [`stocks.${dto.name}`]: dto.quantity }
                },
                { session }
            )

            this.db.collection(Constants.ORDER_COLLECTION).insertOne(
                { email: user.email, createdAt: new Date(), name: dto.name, quantity: dto.quantity, boughtAtPrice: stockData.price },
                { session }
            )
        } catch (error) {
            try {
                await session.abortTransaction();
            } catch (error) {
                
            }
            throw error;
        }
    }

    async get(user: any) {
        const data = await this.db.collection(Constants.ORDER_COLLECTION).aggregate(
            [
                {
                    $match: { email: user.email }
                },
                {
                    $project: {
                        name: 1,
                        boughtAtPrice: 1,
                        quantity: 1,
                        createdAt: 1
                    }
                }
            ]
        ).toArray();

        return { aggregatedData: Object.keys(user.stocks).map(key => ({stockName: key, count: user.stocks[key]})), totalData: data };
    }

    async renderPortfolio(user, res) {
        const data = await this.get(user);
        res.render('portfolio', { portfolio: data });
    }
}
