import { Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { Helper } from '../../../lib/Helper';
import { Constants } from '../../../lib/Constants';
import { WrongAuthentication } from '../../common/dto/WrongAuthentication';
@Injectable()
export class UserService {
    constructor(readonly db: Db) {

    }

    async createUser(email: string, password: string) {
        const hashedPassword = await Helper.hashPassword(password);
        return this.db.collection(Constants.USER_COLLECTION).insert({
            email,
            password: hashedPassword
        });
    }

    async verifyUser(email: string, password: string) {
        const user = await this.db.collection(Constants.USER_COLLECTION).findOne({ email });
        if (!user || !Helper.verifyPassword(password, user.password)) {
            throw new WrongAuthentication('Invalid credentials!');
        }
    }
}
