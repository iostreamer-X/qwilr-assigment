$(document)
.ready(function() {
	const errorSection = $('#loginError');
	errorSection.hide();
	
	$('#logInButton').click(async function (event) {
		const email = $('#loginEmail').val();
		const password = $('#loginPassword').val();
		try {
			const data = await request('/user/login', {
				data: JSON.stringify({
					email,
					password
				}),
				type: 'POST'
			});
			errorSection.hide();
			document.cookie = `token=${data.data.token.trim()}`;
			window.location.href = '/'
		} catch (error) {
			console.log(error);
			errorSection.show();
		}
	});

	$('#signUpButton').click(async function (event) {
		const email = $('#loginEmail').val();
		const password = $('#loginPassword').val();
		try {
			const data = await request('/user/create', {
				data: JSON.stringify({
					email,
					password
				}),
				type: 'POST'
			});
			errorSection.hide();
			document.cookie = `token=${data.data.token.trim()}`;
			window.location.href = '/'
		} catch (error) {
			console.log(error);
			errorSection.show();
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