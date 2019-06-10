import { Injectable, Inject } from '@nestjs/common';
import { AddBalanceDto } from './dto/add-balance.dto';
import { Constants } from '../../../lib/Constants';
import { Db, MongoClient, ClientSession } from 'mongodb';
import { KeyValue, GenericKeyValue } from '../../../lib/Helper';
import { WrongInput } from '../../common/dto/WrongInput';

@Injectable()
export class BalanceService {
    constructor(
        @Inject(Constants.DATABASE_SERVICE) readonly db: Db,
        @Inject(Constants.CLIENT_SERVICE) readonly client: MongoClient
    ) {
    }

    async incrementBalance(email: string, balance: number, session: ClientSession) {
        await this.db.collection(Constants.USER_COLLECTION).updateOne(
            {
                email
            }, 
            {
                $inc: {
                    balance
                }
            },
            {
                session
            }
        );
    }

    async addBalance(user: any, dto: AddBalanceDto) {
        const session = this.client.startSession();
        try {
            await session.startTransaction();
            await this.incrementBalance(user.email, dto.balance, session);
            await session.commitTransaction();
        } catch (error) {
            try {
                await session.abortTransaction();
            } catch (error) {
                
            }
            throw error;
        }
    }

    async removeBalance(user: any, balance: number, session: ClientSession) {
        const remainingBalance = user.balance - balance;
        if (remainingBalance < 0) {
            throw new WrongInput('Insufficient Balance!')
        }

        await this.incrementBalance(user.email, -balance, session);
    }
}
