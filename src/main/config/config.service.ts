import * as Joi from 'joi';
import { Injectable } from '@nestjs/common';
import { KeyValue } from '../../../lib/Helper';
const config = require('../../../config.json');

@Injectable()
export class ConfigService {
	private config: KeyValue;

	constructor() {
		this.config = this.validateConfig(config);
	}

	validateConfig(config: KeyValue) {
		const configSchema = Joi.object({
			mongoOptions: Joi.object().required(),
			jwtSecretKey: Joi.string().required()
		});

		const { error, value: validatedConfig } = Joi.validate(config, configSchema);
		if (error) {
			throw new Error(`Config validation error: ${error.message}`);
		}

		return validatedConfig;
	}

	get(key: string): any {
		return this.config[key];
	}

	getMongoOptions(): any {
		return this.get('mongoOptions');
	}

	getJWTSecretKey() {
		return this.get('jwtSecretKey');
	}
}
