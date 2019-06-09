import { ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Success } from '../../common/dto/Success';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, call$: Observable<any>): Observable<any> {
		return call$.pipe(map((data) => new Success(data)));
	}
}
