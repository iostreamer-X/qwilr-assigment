import { StatusCodeError, RequestError } from 'request-promise/errors';
import { ValidationError, IsInstance, validate, ValidatorConstraint, ValidationArguments } from 'class-validator';
import * as util from 'util';
import { WrongInput } from '../src/common/dto/WrongInput';
import moment = require('moment');
import { Constants } from './Constants';
import * as lodash from 'lodash';
import * as csvStringify from 'csv-stringify';
import * as camelCase from 'camelcase';
import * as xlsx from 'xlsx';
import { RowDto } from '../src/common/dto/RowDto';
import { Repository, getConnection, EntityManager, QueryRunner } from 'typeorm';
import momentTimezone = require('moment-timezone');
import { plainToClass } from 'class-transformer-fixed';
import * as Sentry from '@sentry/node';
const snakeCase = require('snake-case');
import { PassThrough } from 'stream';
import * as statsD from 'hot-shots';
const config = require(`${process.cwd()}/dist/config.json`);

export class Helper {
	static extractHeaders(prefilledData: KeyWithNullableValue[]) {
		if (prefilledData.length === 0) {
			throw new WrongInput('No value for extraction of headers');
		}
		return Object.keys(prefilledData[0]);
	}
	static convertObjectToAOA(prefilledData: KeyWithNullableValue[]) {
		return prefilledData.map((ele) => Object.values(ele));
	}
	static stringConstructor = ''.constructor;
	static arrayConstructor = [].constructor;
	static objectConstructor = {}.constructor;
	static numberConstructor = (0).constructor;
	static dateConstructor = new Date().constructor;

	static whatIsIt(object) {
		if (object === null) {
			return 'null';
		}
		if (object === undefined) {
			return 'undefined';
		}
		if (object.constructor === this.stringConstructor) {
			return 'String';
		}
		if (object.constructor === this.arrayConstructor) {
			return 'Array';
		}
		if (object.constructor === this.objectConstructor) {
			return 'Object';
		}
		if (object.constructor === this.numberConstructor) {
			return 'Number';
		}
		if (object.constructor === this.dateConstructor) {
			return 'Date';
		}
		return 'Other';
	}

	static isVoid(obj) {
		switch (typeof obj) {
			case 'undefined':
				return true;
			case 'object':
				for (const x in obj) {
					if (obj.hasOwnProperty(x)) {
						return false;
					}
					return true;
				}
				return true;
			case 'number':
			case 'boolean':
				return false;
			case 'string':
				if (obj === '' || obj === 'null' || obj === 'undefined') {
					return true;
				}
				return false;
			/* falls through */
			default:
				return false;
		}
	}

	static getUndefinedHandlerProxy(object) {
		const undefinedHandlerProxy = new Proxy(object, {
			get(target, key) {
				if (target[key] === undefined) {
					target[key] = Helper.getUndefinedHandlerProxy({});
				}
				return target[key];
			},
		});
		return undefinedHandlerProxy;
	}

	static getActualValueFromUndefinedhandlerProxy(target, key) {
		if (util.types.isProxy(target[key])) {
			return undefined;
		}
		return target[key];
	}

	static readonly dogstatsd = new statsD.StatsD({
		host: config.datadogStatsdServer || 'localhost',
		globalTags: { environment: process.env.NODE_ENV || '' },
		errorHandler: (error) => {
			console.log('Socket errors caught here: ', error);
		},
		globalize: true,
	});

	static errorCreator(options) {
		const error = new Error();
		if (options) {
			for (const attrname in options) {
				error[attrname] = options[attrname];
			}
		}
		return error;
	}

	static getMessageFromExternalError(object: any): string | undefined {
		if (object instanceof StatusCodeError) {
			return this.getMessageFromExternalError(object.error);
		}
		const message = object.message || object.reason;
		if (message && typeof message === 'string') {
			return message;
		}
		for (const value of Object.values(object)) {
			if (typeof value === 'string') {
				continue;
			}
			return this.getMessageFromExternalError(value);
		}
		return undefined;
	}
	static getReason(validationErrors: ValidationError[]) {
		const reason = validationErrors.reduce((value, current) => {
			if (current.children.length) {
				return `${this.getReason(current.children)} ${value}.`;
			}
			return `${Object.values(current.constraints)} ${value}.`;
		}, '');
		return reason;
	}

	static getTopReason(validationErrors: ValidationError[], parent?: ValidationError) {
		const validationError = validationErrors[0];
		if (validationError.constraints) {
			const contexts = validationError.contexts;
			const prettyName: string | undefined = ((_) => {
				if (!contexts || !Object.keys(contexts).length) {
					return;
				}
				const key = Object.keys(contexts).find((key) => contexts[key].prettyName);
				if (!key) {
					return;
				}
				return contexts[key].prettyName;
			})();
			const property = parent ? `In ${parent.property}: ` : '';
			// tslint:disable-next-line:max-line-length
			return `${property}${Helper.replaceAll(
				Object.values(validationError.constraints).join('. '),
				[validationError.property, '_key'],
				prettyName || validationError.property,
			)}`;
		}
		if (validationError.children.length) {
			return Helper.getTopReason(validationError.children, validationError);
		}
	}

	// tslint:disable-next-line:max-line-length
	static getAllReasonsForValidationError(
		validationError: ValidationError,
		parent?: ValidationError,
		result: { field: string; message: string }[] = [],
	): { field: string; message: string }[] | undefined {
		if (validationError.constraints) {
			const contexts = validationError.contexts;
			const prettyName: string | undefined = ((_) => {
				if (!contexts || !Object.keys(contexts).length) {
					return;
				}
				const key = Object.keys(contexts).find((key) => contexts[key].prettyName);
				if (!key) {
					return;
				}
				return contexts[key].prettyName;
			})();
			result.push({
				field: (parent ? parent.property : '') + validationError.property,
				message: Helper.replaceAll(
					Object.values(validationError.constraints).join('. '),
					[validationError.property, '_key'],
					prettyName || validationError.property,
				),
			});
			return result;
		}
		if (validationError.children.length) {
			return Helper.getAllReasonsForValidationError(validationError.children[0], validationError, result);
		}
	}
	static getAllReasons(validationErrors: ValidationError[]) {
		return Helper.flatten(validationErrors.map((error) => this.getAllReasonsForValidationError(error)));
	}

	static flatten(list: any[]) {
		return list.reduce((a, b) => a.concat(Array.isArray(b) ? this.flatten(b) : b), []);
	}

	static getHeader(header: string, req: any): string | null {
		return req.header(header) || (req.query ? req.query[`header-${header}`] : null) || (req.body ? req.body[`header-${header}`] : null);
	}

	static getTimeFromDateAndTimeValues(params) {
		const presentTime = new Date();
		let isValidTimeSlot = false;
		let timeMomentData;
		const incomingDateFormat = params.incomingDateFormat;
		const incomingTimeFormat = params.incomingTimeFormat;

		if (!incomingTimeFormat || !incomingDateFormat) {
			throw new WrongInput('Wrong Date or Time format in getTimeStringFromTimeSlot');
		}
		const date = moment(params.date, incomingDateFormat, true).format(incomingDateFormat);
		params.time = params.time || 'INVALID TIME';
		timeMomentData = moment(`${date} ${params.time} +05:30`, `${incomingDateFormat} ${incomingTimeFormat} Z`, true).utc();
		const presentTimeMoment = moment(presentTime).utc();
		/*
		if (presentTimeMoment.isSameOrBefore(timeMomentData)) {
			isValidTimeSlot = true;
		}
		*/
		isValidTimeSlot = true;
		return {
			isValidTimeSlot,
			timeMomentData,
		};
	}

	static deleteAllNulls(obj: any, checker = (value) => value === null) {
		if (obj instanceof Array) {
			obj.forEach((data) => this.deleteAllNulls(data));
		} else if (typeof obj === 'object') {
			for (const key in obj) {
				const value = obj[key];
				if (checker(value)) {
					delete obj[key];
				}
				if (obj[key] instanceof Array) {
					obj[key].forEach((data) => this.deleteAllNulls(data));
				} else if (typeof obj[key] === 'object') {
					this.deleteAllNulls(obj[key]);
				}
			}
		}
	}

	static sanitizeStringCode(inp): any {
		if (!inp) {
			return inp;
		}
		return inp
			.toString()
			.toUpperCase()
			.trim();
	}

	static sendAOOAsCSV(aoo, res) {
		res.setHeader('Content-disposition', 'attachment');
		res.set('Content-Type', 'text/csv');
		res.status(200);
		csvStringify(aoo).pipe(res);
	}

	static getUgly = (name) => {
		if (!name) {
			return name;
		}
		return name
			.split(' ')
			.join('_')
			.toLowerCase();
	};

	static async validateDtos<T>(dtos: (T & RowDto)[], field: keyof T, failureArray: FailureArray): Promise<FailureArray> {
		for (const dto of dtos) {
			const errors = await validate(dto, { skipMissingProperties: true });
			if (errors.length) {
				failureArray.push({
					reasons: Helper.getAllReasons(errors),
					[field]: dto[field],
					row: dto.row,
				});
			}
		}

		return failureArray;
	}

	static mergeFailureArray(failureArray: FailureArray) {
		const combinedFailureArray: FailureArray = [];
		const groupedByFailureArray = lodash.groupBy(failureArray, (obj) => obj.identifier);
		for (const referenceNumber in groupedByFailureArray) {
			const failures = groupedByFailureArray[referenceNumber];
			const combinedFailure = failures.reduce((acc, cur) => {
				acc.reasons.push(...cur.reasons);
				return acc;
			});
			combinedFailureArray.push(combinedFailure);
		}

		return combinedFailureArray;
	}

	static saveMultipleToDB<T>(repo: Repository<T>, data: T[]) {
		return repo.insert(data);
	}

	static handleArrayRequestParamInGet(param: string | string[]) {
		if (!param) {
			return param;
		}
		if (typeof param === 'string') {
			if (param === '') {
				return;
			}
			return [param];
		}
		return param;
	}

	static handleBooleanRequestParamInGet(param: string) {
		switch (
			param
				.toString()
				.trim()
				.toLowerCase()
		) {
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				throw new WrongInput('Invalid value for boolean type');
		}
	}

	static handleNumberRequestParamInGet(param: string) {
		if (!param) {
			return param;
		}
		return Number(param);
	}

	static hasKey(obj, key, options?) {
		options = options || {};
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			if (options.blankIsFalse) {
				if (obj[key] !== null && obj[key] !== undefined && obj[key].toString().replace(/\s/g, '').length > 0) {
					return true;
				}
			} else {
				return true;
			}
		}
		return false;
	}

	static convertToCamelCaseObject(data: any) {
		let newData: any;
		let origKey: string;
		let newKey: string;
		let value: any;
		if (data instanceof Array) {
			return data.map((value) => {
				if (typeof value === 'object') {
					value = this.convertToCamelCaseObject(value);
				}
				return value;
			});
		}
		newData = {};
		for (origKey in data) {
			if (data.hasOwnProperty(origKey)) {
				newKey = camelCase(origKey);
				value = data[origKey];
				if (value instanceof Array || (value !== null && typeof value === 'object')) {
					value = this.convertToCamelCaseObject(value);
				}
				newData[newKey] = value;
			}
		}
		return newData;
	}
	static getExcelBufferFromArrayOfObject(aoo: any[]): Buffer {
		const ws = xlsx.utils.json_to_sheet(aoo);
		const wb = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(wb, ws, 'Sheet 1');
		return xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
	}

	static getExcelBufferFromAOAMultipleSheets(options: { aoa: string[][]; sheetName: string }[]): Buffer {
		const wb = xlsx.utils.book_new();
		options.forEach((option) => {
			const ws = xlsx.utils.aoa_to_sheet(option.aoa);
			xlsx.utils.book_append_sheet(wb, ws, option.sheetName);
		});
		return xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
	}

	static getExcelBufferFromAOA(aoo: any[][]): Buffer {
		const ws = xlsx.utils.aoa_to_sheet(aoo);
		const wb = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(wb, ws, 'Sheet 1');
		return xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
	}

	static sendExcelBuffer(name: string, buffer: Buffer, res) {
		res.set('Access-Control-Expose-Headers', 'Content-Disposition');
		res.set('Content-Disposition', `attachment: filename=${name}`);
		res.set('Content-Type', 'application/vnd.ms-excel');
		const bufferStream = new PassThrough();
		bufferStream.end(buffer);
		bufferStream.pipe(res);
	}

	static trimValues(obj: any) {
		if (obj instanceof Array) {
			obj.forEach((data) => this.trimValues(data));
		} else if (typeof obj === 'object') {
			for (const key in obj) {
				if (typeof obj[key] === 'object') {
					this.trimValues(obj[key]);
				} else if (typeof obj[key] === 'string') {
					obj[key] = obj[key].trim();
				} else if (obj[key] instanceof Array) {
					obj[key].forEach((data) => this.trimValues(data));
				}
			}
		}
	}

	static isValidDateRange(fromDate: string, toDate: string, range: number) {
		const start = moment(fromDate, 'YYYY-MM-DD', true);
		const end = moment(toDate, 'YYYY-MM-DD', true);
		const diff = end.diff(start, 'days');
		if (diff < 0) {
			throw new WrongInput('Invalid date range found');
		}
		return diff <= range;
	}

	static convertObjectToSnake(obj: any) {
		if (obj instanceof Array) {
			obj.forEach((data) => this.convertObjectToSnake(data));
		} else if (typeof obj === 'object') {
			for (const key in obj) {
				const value = obj[key];
				delete obj[key];
				const newKey = snakeCase(key);
				obj[newKey] = value;
				if (obj[newKey] instanceof Array) {
					obj[newKey].forEach((data) => this.convertObjectToSnake(data));
				} else if (typeof obj[newKey] === 'object') {
					this.convertObjectToSnake(obj[newKey]);
				}
			}
		}
	}

	static createNestedObject(obj: any, startString: string): any {
		const resultantObject = {};
		for (const key of Object.keys(obj).filter((key) => key.startsWith(startString))) {
			const subKey = key.split(startString)[1];
			resultantObject[subKey] = obj[key];
		}

		return resultantObject;
	}

	static normalize<T>(keys: string[], object: any) {
		for (const key of keys) {
			object[key] = Helper.createNestedObject(object, key);
		}
		return object as T;
	}
	static getQueryRunner(options: GenericKeyValue<string | undefined> = {}) {
		const { connectionName } = options;
		const connection = getConnection(connectionName);
		return connection.createQueryRunner();
	}

	static async runTransactionCommand(query: 'BEGIN' | 'COMMIT' | 'ROLLBACK', queryRunner: QueryRunner, options: KeyValue = {}) {
		return queryRunner.query(query);
	}

	static beginTransaction = Helper.runTransactionCommand.bind(Helper, 'BEGIN');
	static commitTransaction = Helper.runTransactionCommand.bind(Helper, 'COMMIT');
	static rollbackTransaction = Helper.runTransactionCommand.bind(Helper, 'ROLLBACK');

	static getQueryStringFromObject(object: any) {
		return Object.keys(object)
			.map((key) => `${key}=${object[key]}`)
			.join();
	}

	static getQueryValuesFromObject(object: any) {
		return Object.values(object)
			.map((key) => `'${key}'`)
			.join();
	}

	static getParametrizedQueryStringFromObjectForFilter(object: any, offset = 0, joiner = ',', operator = 'IN') {
		return Object.keys(object)
			.map((key, index) => {
				let strToReturn = '';
				let objectKey = lodash.cloneDeep(object[key]);
				if (objectKey instanceof Array && objectKey.length > 0) {
					if (objectKey.includes(null) || objectKey.includes(undefined)) {
						objectKey = objectKey.filter((ele) => ele !== null && ele !== undefined); // remove null and undefined values
						strToReturn = `(${key} ${operator} ${this.getInStr(objectKey.length, index + offset + 1)} OR ${key} IS NULL)`;
					} else {
						strToReturn = `${key} ${operator} ${this.getInStr(objectKey.length, index + offset + 1)}`;
					}
				} else if (!(objectKey instanceof Array)) {
					if (objectKey === null || objectKey === undefined) {
						strToReturn = `${key} IS NULL`;
						offset = offset - 1;
					} else {
						strToReturn = `${key}=$${index + offset + 1}`;
					}
				}
				offset = offset + (objectKey instanceof Array && objectKey.length > 0 ? objectKey.length - 1 : 0);
				return strToReturn;
			})
			.join(joiner);
	}

	static getParametrizedQueryStringFromObject(object: any, offset = 0, joiner = ',', operator = 'IN') {
		return Object.keys(object)
			.map((key, index) => {
				return `\"${key}\"=$${index + offset + 1}`;
			})
			.join(joiner);
	}

	static getInStr(length: number, startingPos: number = 1) {
		const paramInStrArr: any = [];
		for (let i = 0; i < length; i = i + 1) {
			paramInStrArr.push(`$${i + startingPos}`);
		}
		const paramsInStr = `(${paramInStrArr.join(',')})`;
		return paramsInStr;
	}

	static sortArrayOfNumericString(inp: any) {
		if (!inp || !(inp instanceof Array)) {
			return;
		}
		inp.sort((a: string, b: string) => {
			if (a.length !== b.length) {
				return a.length - b.length;
			}
			return a < b ? -1 : 1;
		});
	}
	static getStrictMomentFromDatestring(dateString, timezone) {
		const timezoneToSet = timezone || 'Asia/Kolkata';
		return momentTimezone.utc(dateString, 'YYYY-MM-DD', true).tz(timezoneToSet, true);
	}

	static getStartOfDay(dateObj, timezone) {
		const timezoneToSet = timezone || 'Asia/Kolkata';
		return momentTimezone(dateObj)
			.tz(timezoneToSet)
			.startOf('day')
			.toDate();
	}

	static getEndOfDay(dateObj, timezone) {
		const timezoneToSet = timezone || 'Asia/Kolkata';
		return momentTimezone(dateObj)
			.tz(timezoneToSet)
			.endOf('day')
			.toDate();
	}
	static getArrayHandledDto<T>(context: T & object, map: any) {
		return new Proxy(context, {
			set(target, key, value, reason) {
				if (Object.keys(map).includes(key as string)) {
					if (value instanceof Array) {
						value = value.map((element, index) => {
							element.row = index + 1;
							return plainToClass(map[key as string], element);
						});
					}
				}
				target[key] = value;
				return true;
			},
		});
	}

	static handleArray<K>(map: { [key in keyof K]?: any }) {
		return function<T extends { new (...args: any[]): {} }>(DTO: T) {
			return class extends DTO {
				constructor(...args) {
					super(args);
					return Helper.getArrayHandledDto(this, map);
				}
			};
		};
	}

	static getArrayRowHandledDto<T>(context: T & object, map: any) {
		return new Proxy(context, {
			set(target, key, value, reason) {
				if (Object.keys(map).includes(key as string)) {
					if (value instanceof Array) {
						value = value.map((element, index) => {
							element.row = index + 1;
							return element;
						});
					}
				}
				target[key] = value;
				return true;
			},
		});
	}

	static handleArrayRow<K>(map: { [key in keyof K]?: any }) {
		return function<T extends { new (...args: any[]): {} }>(DTO: T) {
			return class extends DTO {
				constructor(...args) {
					super(args);
					return Helper.getArrayRowHandledDto(this, map);
				}
			};
		};
	}

	static setFailureObject<T>(object: FailableItem<T>, errors: { field: keyof T | ''; message: string }[], identifier?: string | number, extraDetails?: any) {
		object.failed = true;
		object.failureObject = {
			row: object.row,
			identifier,
			extraDetails,
			reasons: errors.map((err) => ({ message: err.message, field: err.field as string })),
		};
	}

	static parseFailureObjects<T>(object: (T & FailableObject & RowDto)[]) {
		return object.filter((data) => data.failureObject);
	}

	static getFailureArrayFromFailableObjectArray<T>(object: (T & FailableObject & RowDto)[]): FailureArray {
		return this.parseFailureObjects(object).map((data) => ({
			row: data.row,
			objectId: data.objectId,
			indentifier: data.failureObject.identifier,
			reasons: data.failureObject.reasons,
			extraDetails: data.failureObject.extraDetails,
		}));
	}

	static removeTrailingRowsForCSV(inputArray: any, fieldsToCheck: string[]) {
		let lastIndex = -1;

		const func = function(elem) {
			const fun = function(key) {
				return elem[key] !== null && elem[key] !== undefined && elem[key] !== '';
			};
			return fun;
		};
		// Could have created this function in the for loop, but jshint complains that function should no be
		// created in a loop
		// tslint:disable-next-line:no-increment-decrement
		for (let i = inputArray.length - 1; i >= 0; i--) {
			let doesRowHaveData = false;
			if (inputArray[i]) {
				doesRowHaveData = fieldsToCheck.some(func(inputArray[i]));
			}
			if (doesRowHaveData) {
				lastIndex = i;
				break;
			}
		}
		return inputArray.slice(0, lastIndex + 1);
	}

	static getDateString(dateObj: Date, timezone?: string) {
		const timezoneToSet = timezone || 'Asia/Kolkata';
		return momentTimezone(dateObj)
			.tz(timezoneToSet)
			.format('YYYY-MM-DD');
	}

	// tslint:disable-next-line:function-name
	static getValidator(predicate: (...args: any[]) => boolean) {
		@ValidatorConstraint({ name: 'validator', async: false })
		class Validator {
			validate(args: any) {
				return predicate(args);
			}
			defaultMessage(args: ValidationArguments) {
				return 'Invalid ($value)!';
			}
		}

		return Validator;
	}

	static getCurrentDate(timezone) {
		return momentTimezone(new Date())
			.tz(timezone)
			.format('YYYY-MM-DD');
	}

	static getCurrentDateEpoch(timezone) {
		return momentTimezone(new Date())
			.tz(timezone)
			.valueOf();
	}

	static formatDate(timezone, date) {
		return momentTimezone(date)
			.tz(timezone)
			.format('YYYY-MM-DD');
	}

	static getEpochColumn(column: string, alias = column) {
		return `EXTRACT(EPOCH FROM ${column}) * 1000 AS "${alias}"`;
	}

	static getFlattenedArray(arr: any) {
		return [].concat.apply([], arr);
	}

	static replaceAll(string: string, search: string | string[], replacement?: string) {
		if (!replacement) {
			return string;
		}
		const toSearch = search instanceof Array ? search : [search];
		return string.replace(new RegExp(`(${toSearch.join('|')})`, 'g'), replacement);
	}

	static getStringDate(column: string, timezone: string) {
		return `TO_CHAR(${column} at time zone '${timezone}', 'YYYY-MM-DD') `;
	}

	static captureException(error, user?: any): Promise<string> {
		return new Promise((resolve, reject) => {
			if (user) {
				Sentry.configureScope((scope) => {
					scope.setUser({
						name: user.name,
						id: user.id,
						username: user.username,
						email: user.email,
						phone: user.phone,
					});
				});
			}
			Sentry.captureException(error);
			resolve();
		});
	}

	static objectArraySum(obj: any, filter: any) {
		// filter will have keys whoses sum we want with default values
		const keys = Object.keys(filter);
		const result = {};
		keys.forEach((key) => {
			result[key] = obj.reduce((acc, curr) => {
				return acc + (!curr[key] ? 0 : curr[key]);
			}, filter[key]);
		});
		return result;
	}

	static getTimestampWithTimezoneFromTimeObject(params) {
		const timeObject = params.timeObject;
		const timezone = params.timezone;

		if (!timeObject || !timezone) {
			throw new WrongInput(`Invalid params in getTimestampWithTimezoneFromTimeObject: ${JSON.stringify(params)}`);
		}
		return momentTimezone
			.utc((timeObject.dateString || 'INVALID DATE') + ' ' + (timeObject.time || 'INVALID TIME'), `YYYY-MM-DD HH:mm`, true)
			.tz(timezone, true);
	}

	static slidingIterator<T>(array: T[], batchSize: number = 1) {
		let index = 0;
		function next() {
			const lastIndex = Math.min(array.length, index + batchSize);
			const value = array.slice(index, lastIndex);
			index += batchSize;
			if (lastIndex === array.length) {
				return {
					value,
					done: true,
				};
			}
			return {
				value,
				done: false,
			};
		}
		return {
			next,
		};
	}
	static slidingGenerator<T>(array: T[], batchSize = 1) {
		const iterator = Helper.slidingIterator<T>(array, batchSize);
		let result = iterator.next();
		return {
			// tslint:disable-next-line:function-name
			*[Symbol.iterator]() {
				while (result.value.length !== 0) {
					yield result.value;
					result = iterator.next();
				}
			},
		};
	}
}

export type AllowedValueType = string | boolean  | Date | string[] | null | number | undefined | KeyWithNullableValue;
export type KeyWithNullableValue = { [key: string]: AllowedValueType };
export type KeyValue = { [key: string]: string };
export type KeyArrayValue = { [key: string]: string[] };
export type GenericKeyValue<T> = { [key: string]: T };
export type ObjectKeyValue = GenericKeyValue<AllowedValueType>;
export type FailureArray = FailureObject[];
export type FailureArrayResponse = { failureArray: FailureArray };
// tslint:disable-next-line: max-line-length
export type FailureReason = { message: string; field: string; objectId?: AllowedValueType };
export type FailureReasons = FailureReason[];
export type FailureObject = { row: number; identifier?: string | number; extraDetails?: any; reasons: FailureReasons };
export type FailableObject = { failed: boolean; failureObject: FailureObject };
export type FailableItem<T> = T & FailableObject & RowDto & ObjectKeyValue;
export type OrderByType = 'ASC' | 'DESC';
// tslint:disable-next-line:variable-name
export const AllowedOrderByTypes = ['ASC', 'DESC'];

export type SubTypeExcept<Base, Condition> = Pick<Base, { [Key in keyof Base]: Key extends Condition ? never : Key }[keyof Base]>;

export type SuperType<Base, types extends string> = Base & { [key in types]: any };

export class Failure {
	constructor(readonly failureArray: FailureArray) {}
}
