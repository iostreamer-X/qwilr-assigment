export class Constants {
	static readonly DEFAULT_PORT = 3040;
	static readonly DEFAULT_ORGANISATION_KEY = 'deforg';
	static readonly WRONG_INPUT_ERROR = 'WRONG_INPUT';
	static readonly WRONG_AUTHENTICATION_ERROR = 'WRONG_AUTHENTICATION';
	static readonly INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER';
	static readonly DATABASE_SERVICE = 'DATABASE_SERVICE_TOKEN';
	static readonly MONGO_DATABASE_SERVICE = 'MONGO_DATABASE_SERVICE_TOKEN';
	static readonly ORGANISATION_SERVICE_TOKEN = 'OrganisationConfigService';
	static readonly DEFAULT_APP_NAME = 'SHIPPERS_DASHBOARD';
	static readonly LTL_COURIER_PARTNER_OBJECT = 'LTL_COURIER_PARTNER';

	static readonly CONCURRENCY_LIMIT = 10;
	static readonly CONCURRENCY_LIMIT_FOR_LOCK = 2;
	static readonly CONCURRENCY_LIMIT_FOR_LOOP = 1;

	static readonly VIRTUAL_SERIES_MODEL = 'VirtualSeries';
	static readonly VIRTUAL_SERIES_COLLECTION = 'consignmentNumbers';
	static readonly VIRTUAL_NUMBER_MODEL = 'VirtualNumber';
	static readonly VIRTUAL_NUMBER_COLLECTION = 'virtualNumbers';
	static readonly NO_SERIES_AVAILABLE = 'NO_SERIES_AVAILABLE';

	static readonly LTL_DOWNLOAD_COLLECTION = 'ltlDownloadCollection';
	static readonly LTL_DOWNLOAD_MODEL = 'ltlDownloadModel';

	static readonly LTL_COURIER_PARTNER_TABLE = 'ltl_courier_partner';

	static readonly DEFAULT_NUMBER_OF_RECORDS = 10;
	static readonly MAX_NUMBER_OF_RECORDS = 100;

	static readonly USER_COLLECTION = 'users';
}
