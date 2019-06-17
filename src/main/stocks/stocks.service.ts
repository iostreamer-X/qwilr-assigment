import { Injectable, Inject } from '@nestjs/common';
import { Constants } from '../../../lib/Constants';
import { Db } from 'mongodb';

@Injectable()
export class StocksService {
    constructor(
        @Inject(Constants.DATABASE_SERVICE) readonly db: Db,
    ) {
    }

    async getStockData() {
        return this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).find().toArray();
    }

    async getSingleStockData(name: string) {
        return this.db.collection(Constants.STOCK_MASTER_DATA_COLLECTION).findOne({ name });
    }
}
