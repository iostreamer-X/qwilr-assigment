const config = require('./config.json');
const helper = require('../helper');
if (!config) {
    throw new Error('Please setup script config')
}

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(config.mongoUri, { useNewUrlParser: true });

const Alpaca = require('@alpacahq/alpaca-trade-api')
const alpaca = new Alpaca({ keyId: config.alpacaKeyId, secretKey: config.alpacaSecretKey })


const STOCK_MASTER_DATA_COLLECTION = 'stock_master_data';
const ALPACA_SYMBOL_LIMIT = 200;

async function getDatabaseInstance() {
    await client.connect();
    return client.db(config.dbName);
}

async function initialize() {
    const db = await getDatabaseInstance();
    return { db };
}

async function main(options = {}) {
    console.log('STARTED AT', new Date());
    const { db } = options;
    if (!db) {
        throw new Error('db instance not provided')
    }
    const bulk = db.collection(STOCK_MASTER_DATA_COLLECTION).initializeOrderedBulkOp();

    const stockMasterData = await db.collection(STOCK_MASTER_DATA_COLLECTION).find().toArray();
    for (const stockDataArray of helper.slidingGenerator(stockMasterData, ALPACA_SYMBOL_LIMIT)) {
        const barset = await alpaca.getBars(
            'minute',
            stockDataArray.map(stockData => stockData.name).join(),
            {
                limit: 1
            }
        );

        for (const key in barset) {
            const currentPrice = getCurrentPrice(barset[key][0]);
            const currentOHCLV = getOHLCV(barset[key][0]);

            bulk.find({ name: key }).update({ $set: {price: currentPrice, ohclv: currentOHCLV, lastUpdatedAt: new Date()} })
        }
        bulk.execute();    
    }
}

function getCurrentPrice(data) {
    if (!data) {
        return;
    }
    return data.c;
}

function getOHLCV(data) {
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

initialize().then(configOptions => {
    setInterval(main.bind(null, configOptions), process.env.INTERVAL || config.INTERVAL || 500);
});