import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, HttpException } from '@nestjs/common';
import { BaseError } from '../../common/dto/BaseError';
import { InternalServer } from '../../common/dto/InternalServer';
import { Helper } from '../../../lib/Helper';
import * as Sentry from '@sentry/node';

@Catch(HttpException, Error)
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse();
		if (exception instanceof BaseError) {
			const status = exception.getStatus();
			res.status(status).json({
				error: {
					...exception,
					stack: exception.stack,
				},
			});
			Sentry.captureException(exception);
		} else if (exception instanceof Error) {
			if (!process.env.NODE_ENV || process.env.NODE_ENV === 'dev') {
				console.log(exception);
			}
			Sentry.captureException(exception);

			if ((exception as any).status) {
				return res.status((exception as any).status).json({
					error: (exception as any).response,
				});
			}
			const internalServerError = new InternalServer(exception.message, exception.stack);
			res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				error: {
					...internalServerError,
					stack: internalServerError.stack,
				},
			});
		}
	}
}
