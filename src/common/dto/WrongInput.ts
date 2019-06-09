import { BaseError } from './BaseError';
import { HttpStatus } from '@nestjs/common';
import { Constants } from '../../../lib/Constants';
import { ValidationError } from 'class-validator';
import { Helper } from '../../../lib/Helper';

export class WrongInput extends BaseError {
	public message: string;
	constructor(input: string | ValidationError[]) {
		super(Constants.WRONG_INPUT_ERROR, 400);
		if (typeof input === 'string') {
			this.message = input;
		} else {
			const topReason = Helper.getTopReason(input);
			this.message = topReason;
		}
	}

	addOptions(options) {
		for (const key in options) {
			this[key] = options[key];
		}
	}
}
