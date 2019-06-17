const newrelic = require('newrelic');
import { NestFactory } from '@nestjs/core';
import { MainModule } from './main/main.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';
import * as bluebird from 'bluebird';
import * as Sentry from '@sentry/node';
import * as bodyParser from 'body-parser';
import 'reflect-metadata';
import { Constants } from '../lib/Constants';
const path = require('path');
import * as express from 'express';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setHeaders } from './common/SetHeaders';
import * as cors from 'cors';
import { DefaultValidatorPipe } from './common/validators/default-validator/default-validator.pipe';
import { setupRoutes } from './routes';
const config = require('../config.json');
const pathLocator = require('path');
const instance = express();
import * as cookieParser from 'cookie-parser';

function setUpSentry(app, instance) {
	Sentry.init({
		dsn: config.sentryKey,
		environment: process.env.NODE_ENV || 'dev',
	});
	instance.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
}

function setupAPIDocs(app, instance) {
	const options = new DocumentBuilder()
		.setTitle('Stock Portfolio Qwillr API Server')
		.setDescription('Stock Portfolio Qwillr APIs')
		.setVersion('1.0')
		.setSchemes('http', 'https')
		.build();
	const document = SwaggerModule.createDocument(app, options);

	instance.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
}

function setupPromise() {
	global.Promise = bluebird;
}

function setupInterceptors(app) {
	app.useGlobalInterceptors(new GlobalResponseInterceptor());
}

function setupFilters(app) {
	app.useGlobalFilters(new GlobalExceptionFilter());
}

function setupPipes(app) {
	app.useGlobalPipes(new DefaultValidatorPipe());
}

function setupCors(app, instance) {
	instance.options(
		'*',
		cors({
			// tslint:disable-next-line: max-line-length
			allowedHeaders:
				'Origin, X-Requested-With, Content-Type, Accept, Authorization, user-id, access-token,' +
				'organisation-id, organisation-pretty-name, Content-Disposition, X-LogRocket-URL, application-type',
			exposedHeaders: 'Content-Disposition',
		}),
	);
}

function setupMiddlewares(app, instance) {
	instance.use(setHeaders);
	instance.use(
		bodyParser.json({
			limit: '100mb',
		}),
	);
}

function setupPug(app, instance) {
	instance.use(express.static(__dirname + '/../public'))
	instance.set('views', __dirname + '/../public/views');
	instance.set('view engine', 'pug');
}

function setupCookieParser(app, instance) {
	instance.use(cookieParser());	
}

function setup(app, instance) {
	setupCookieParser(app, instance);
	setupMiddlewares(app, instance);
	setupPromise();
	setUpSentry(app, instance);
	setupCors(app, instance);
	setupAPIDocs(app, instance);
	setupInterceptors(app);
	setupFilters(app);
	setupPipes(app);
	setupPug(app, instance);
}

async function bootstrap() {
	const app = await NestFactory.create(MainModule, instance);
	setup(app, instance);
	const server = await app.listen(Number(process.env.PORT) || Constants.DEFAULT_PORT);
	server.setTimeout(500000000);
}
bootstrap();
