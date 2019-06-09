import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { Helper } from '../../../lib/Helper';

@Injectable()
export class NullTransform implements PipeTransform<any> {
	transform(value, metadata: ArgumentMetadata) {
		Helper.deleteAllNulls(value);
		return value;
	}
}
