import { Injectable, Inject } from '@nestjs/common';
import { Constants } from '../../../lib/Constants';
import { Db } from 'mongodb';
import * as Alpaca from '@alpacahq/alpaca-trade-api'
import { ConfigService } from '../config/config.service';
@Injectable()
export class StocksService {
    alpaca: Alpaca;
    constructor(
        @Inject(Constants.DATABASE_SERVICE) readonly db: Db,
        readonly configService: ConfigService
    ) {
        this.alpaca = new Alpaca({ keyId: this.configService.getAlpacaKeyId(), secretKey: this.configService.getAlpacaSecretKey() });
    }

    async getStockData(name?: string) {
        const query = name ? { name } : undefined
        return this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).find(query).toArray();
    }

    async getSingleStockData(name: string) {
        return this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).findOne({ name });
    }

    async search(name: string) {
        const result = await this.getSingleStockData(name);
        if (result) {
            return {
                symbol: result.name
            }
        }
        return this.alpaca.getAsset(name);
    }

    async addToMasterDataAndUpdate(name: string) {
        const result = await this.getSingleStockData(name);
        if (result) {
            return;
        }
        const barset = await this.alpaca.getBars(
            'minute',
            [name],
            {
                limit: 1
            }
        );

        const currentPrice = this.getCurrentPrice(barset[name][0]);
        const currentOHCLV = this.getOHLCV(barset[name][0]);

        this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).insertOne(
            {
                name,
                price: currentPrice, 
                ohclv: currentOHCLV, 
                lastUpdatedAt: new Date()
            }
        );
    }
    getCurrentPrice(data) {
        if (!data) {
            return;
        }
        return data.c;
    }

    getOHLCV(data) {
        if (!data) {
            return {};
        }
    
        return {
            o: data.o,
            h: data.h,
            l: data.l,
            c: data.c,
            v: data.v,
        }
    }
}
