export function setupRoutes(instance) {
    instance.get('/', function (req, res) {
		res.render('index', { title: 'Hey', message: 'Hello there!' });
    });
    
    instance.get('/login', function (req, res) {
		res.render('login', { title: 'Hey', message: 'Hello there!' });
	});
}