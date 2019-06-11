$(document)
.ready(function() {
	const token = (document.cookie.split('; ').find(_ => _.startsWith('token=')) || '').split('=')[1];
	if (!token) {
		window.location.href = '/login';
		return;
	}
	window.location.href = '/app';
});