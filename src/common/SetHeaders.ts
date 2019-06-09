export function setHeaders(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization, user-id, access-token, organisation-id, organisation-pretty-name, application-type',
		'Content-Disposition',
		'X-LogRocket-URL',
	);
	next();
}
