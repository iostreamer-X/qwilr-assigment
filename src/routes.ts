export function setupRoutes(instance) {
    instance.get('/', function (req, res) {
		res.render('index', { stockData: [{ name: 'Yay', price: '23' }] });
    });
    
    instance.get('/login', function (req, res) {
		res.render('login', { title: 'Hey', message: 'Hello there!' });
	});
}