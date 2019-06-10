import { Constants } from '../../../lib/Constants';
import { ConfigService } from '../config/config.service';
import { MongoClient } from 'mongodb'


// tslint:disable-next-line:variable-name
export const ClientService = {
	provide: Constants.CLIENT_SERVICE,
	useFactory: async (config: ConfigService) => {
		const options = config.getMongoOptions();
		const client = new MongoClient(options.mongoUri, { useNewUrlParser: true });
		
		return client;
	},
	inject: [ConfigService],
};

// tslint:disable-next-line:variable-name
export const DatabaseService = {
	provide: Constants.DATABASE_SERVICE,
	useFactory: async (config: ConfigService, client: MongoClient) => {
		const options = config.getMongoOptions();
        await client.connect();
        return client.db(options.dbName);
	},
	inject: [ConfigService, Constants.CLIENT_SERVICE],
};
