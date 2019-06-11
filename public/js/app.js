$(document)
.ready(function() {
    handleAddBalance();
    hideCart();
    handleAddToCart();
    handleStockQuantity();
    handleBuy();
    handlePortfolio();

    $('#buyError').hide();
    $('#buySuccess').hide();
});

function viewCart(name, price) {
    $('#cart').show();
    $('#stockBuyName').text(name);
    $('#stockBuyPrice').text(price);
}

function hideCart() {
    $('#cart').hide();
}

function handleStockQuantity() {
    $('#addStockQuantity').click(function (params) {
        const quantity = Number($('#stockQuantity').val());
        $('#stockQuantity').val(quantity + 1); 
    });
}

function handleAddToCart() {
    $('#addToCartButton').click(function (event) {
        const stockName = $('#addToCartButton').attr('stockName');
        const stockPrice = $('#addToCartButton').attr('stockPrice');
        $('#buyButton').attr('stockName', stockName);
        $('#buyButton').attr('stockPrice', stockPrice);
        viewCart(stockName, stockPrice);
    });
}

function handleAddBalance() {
    $('#addBalanceButton').click(async function (event) {
		const amount = Number($('#amount').val());
		try {
            await request('/balance/add', {
                data: JSON.stringify({
                    balance: amount
                }),
                type: 'POST'
            });
            await renderUpdatedBalance();
        } catch (error) {
            console.log(error);
        }
	});
}

function handlePortfolio() {
    $('#portfolioButton').click(async function (event) {
        window.location.href = '/portfolio';
	});
}

async function renderUpdatedBalance() {
    const { data: {balance} } = await request('/balance/get', {
        type: 'GET'
    });
    $('#balance').text(`Current Balance: ${balance}`);
    $('#amount').val('');
}

function handleBuy() {
    $('#buyButton').click(async function (params) {
        const stockName = $('#buyButton').attr('stockName');
        const quantity = Number($('#stockQuantity').val());
        try {
            await request('/balance/stocks/buy', {
                data: JSON.stringify({
                    name: stockName,
                    quantity
                }),
                type: 'POST'
            });
            await renderUpdatedBalance();
            $('#buyError').hide();
            $('#buySuccess').show();
            $('#stockQuantity').val('');
            setTimeout(function () {
                $('#buySuccess').hide();
            }, 1500)
        } catch (error) {
            console.log(error);
            $('#buyError').show();
            $('#buyErrorMessage').text(error.responseJSON.error.message);
        }  
    })
}

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