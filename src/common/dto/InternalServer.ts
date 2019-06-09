import { BaseError } from './BaseError';
import { HttpStatus } from '@nestjs/common';
import { Constants } from '../../../lib/Constants';
import { ValidationError } from 'class-validator';
import { Helper } from '../../../lib/Helper';

export class InternalServer extends BaseError {
	public message: string;
	public stack?: string;
	constructor(message: string, stack?: string) {
		super(Constants.INTERNAL_SERVER_ERROR, 500);
		this.message = message;
		if (stack) {
			this.stack = stack.toString();
		}
	}

	addOptions(options) {
		for (const key in options) {
			this[key] = options[key];
		}
	}
}
