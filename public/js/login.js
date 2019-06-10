$(document)
.ready(function() {
	const errorSection = $('#loginError');
	errorSection.hide();
	
	$('.ui.form').submit(async function (event) {
		const email = $('#loginEmail').val();
		const password = $('#loginPassword').val();
		console.log(email, password);
		$.ajax('/user/login', {
			data: {
				email,
				password
			},
			type: 'POST'
		})
		.done(function (data) {
			errorSection.hide();
			document.cookie = `token=${data.data.token}`;
			window.location.href = '/'
		})
		.fail(function () {
			errorSection.show();
		})
		event.preventDefault();
	});
});