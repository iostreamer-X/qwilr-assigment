import { ArgumentMetadata, Pipe, PipeTransform, Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer-fixed';
import * as lodash from 'lodash';
import { WrongInput } from '../../dto/WrongInput';
@Injectable()
export class DefaultValidatorPipe implements PipeTransform {
	async transform(value: any, metadata: ArgumentMetadata) {
		console.log(value);
		const { metatype } = metadata;
		const object = !metatype ? value : plainToClass(metatype, value);
		const errors = await validate(object);
		if (errors.length) {
			throw new WrongInput(errors);
		}

		return object;
	}
}
