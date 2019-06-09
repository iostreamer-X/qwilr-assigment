import { Constants } from '../../../lib/Constants';
import { ConfigService } from '../config/config.service';
import { MongoClient } from 'mongodb'


// tslint:disable-next-line:variable-name
export const DatabaseService = {
	provide: Constants.DATABASE_SERVICE,
	useFactory: async (config: ConfigService) => {
		const options = config.getMongoOptions();
        const client = new MongoClient(options.mongoUri, { useNewUrlParser: true });
        await client.connect();

        return client.db(options.dbName);
	},
	inject: [ConfigService],
};
