import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { Helper, KeyValue } from '../../../lib/Helper';
import { Constants } from '../../../lib/Constants';
import { WrongAuthentication } from '../../common/dto/WrongAuthentication';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ConfigService } from '../config/config.service';
import * as jwt from 'jsonwebtoken';
import { WrongInput } from '../../common/dto/WrongInput';
@Injectable()
export class UserService {
    constructor(
        @Inject(Constants.DATABASE_SERVICE) readonly db: Db,
        readonly configService: ConfigService
    ) {
        console.log()
    }

    async createUser(dto: CreateUserDto) {
        const user = await this.db.collection(Constants.USER_COLLECTION).findOne({ email: dto.email });
        if (user) {
            throw new WrongInput('User already exists!');
        }
        const hashedPassword = await Helper.hashPassword(dto.password);
        await this.db.collection(Constants.USER_COLLECTION).insertOne({
            email: dto.email,
            password: hashedPassword
        });
    }

    async verifyUser(email: string, password: string) {
        const user = await this.db.collection(Constants.USER_COLLECTION).findOne({ email });
        if (!user || !(await Helper.verifyPassword(password, user.password))) {
            throw new WrongAuthentication('Invalid credentials!');
        }
    }

    async getUser(email: string) {
        const user = await this.db.collection(Constants.USER_COLLECTION).findOne({ email });
        return user;
    }

    async login(dto: LoginUserDto) {
        await this.verifyUser(dto.email, dto.password);
        return {
            token: this.getLoginToken({ email: dto.email })
        };
    }

    getLoginToken(payload: KeyValue) {
        const token = jwt.sign(
            payload, 
            this.configService.getJWTSecretKey(),
            {
                expiresIn : 15 * 24 * 60 * 60 // 15 days
            }
        );
        return token;
    }
}
