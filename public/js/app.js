$(document)
.ready(function() {
	$('#addBalanceButton').click(async function (event) {
		const amount = Number($('#amount').val());
		try {
            await request('/balance/add', {
                data: JSON.stringify({
                    balance: amount
                }),
                type: 'POST'
            });
            const { data: {balance} } = await request('/balance/get', {
                type: 'GET'
            });
            $('#balance').text(`Current Balance: ${balance}`);
            $('#amount').val('');
        } catch (error) {
            console.log(error);
        }
	});
});

function request(url, options) {
    return new Promise((resolve, reject) => {
        $.ajax(url, {
            dataType: 'json',
            contentType: 'application/json',
            ...options
        })
		.done(function (data) {
            resolve(data)
		})
		.fail(function (data) {
			reject(data);
		});
    });
}