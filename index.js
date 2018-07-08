

// BN - Binance 
// UA - BTC trade UA
const USD_RATE = 26.1; //d
const USDT_SELL_RATE_UA = 0.97; //d
const AVARAGE_COIN_TRANSACTION_FEE = 6; //d
const CAPITAL = 2000;
const EXPECTED_PERCENT_PURE_INCOME = 5;
const ETC_BTC_RATE = 0.077; // as example; //d
let income = 40; // as example
let logs = [];

// TODO add enter price and out price
// v2 all this data should be got dynamicly
const CYLCE_EXPENSES_DATA = {
	COIN_FEE_PERCENT_UA: 0.1, // v2 d
	COIN_FEE_PERCENT_BN: 0.1, // v2
	TRANSACTION_FEE_USDT_BN: 3.9, // v2`
	COIN_TRANSATION_FEE_UA: AVARAGE_COIN_TRANSACTION_FEE, // d
}

const {
	COIN_FEE_PERCENT_UA,
	COIN_FEE_PERCENT_BN,
	TRANSACTION_FEE_USDT_BN,
	COIN_TRANSATION_FEE_UA,
} = CYLCE_EXPENSES_DATA;

const CAPITAL_AND_EXPECTED_PURE_INCOME = CAPITAL + percentFromX(EXPECTED_PERCENT_PURE_INCOME, CAPITAL);
const TRANSACTION_FEE_USDT_TO_HRN_UA = percentFromX((CAPITAL + percentFromX(EXPECTED_PERCENT_PURE_INCOME, CAPITAL)), COIN_FEE_PERCENT_UA); // v2 percentFromX(EXPECTED_PERCENT_PURE_INCOME, CAPITAL) should be replaced on real pureMargin from init(); 
const EXPENSE_USDT_TO_HRN_UA = CAPITAL_AND_EXPECTED_PURE_INCOME * (1 - USDT_SELL_RATE_UA);
// const CYLCE_EXPENSES = percentFromX(COIN_FEE_PERCENT_UA + COIN_FEE_PERCENT_BN, CAPITAL) + COIN_TRANSATION_FEE_UA + TRANSACTION_FEE_USDT_BN + TRANSACTION_FEE_USDT_TO_HRN_UA + EXPENSE_USDT_TO_HRN_UA; v0
const CYLCE_EXPENSES = percentFromX(COIN_FEE_PERCENT_UA * 2 + COIN_FEE_PERCENT_BN, CAPITAL) + AVARAGE_COIN_TRANSACTION_FEE * 2;
const CYLCE_EXPENSES_PERCENT = CYLCE_EXPENSES * 100 / CAPITAL;
const PURE_INCOME = (income - CYLCE_EXPENSES) * USDT_SELL_RATE_UA;

setInterval(function() {
	Promise.all([
			fetchPairOrders('btc_uah', 'buy'),
			fetchPairOrders('usdt_uah', 'buy'),
			fetchPairOrders('eth_uah', 'sell'),
			getCoinPrice()
		]).then((val) => {
		init(val);
	})
}, 5 * 60 * 1000);

function init(val) {
	let state = {
		ordersSellBtcUahUA: val[0],
		ordersUsdtUahUA: val[1], // not need
		ordersBuyCoinUahUA: val[2],
		coefficientCoinBtcBN: val[3].data["1027"].quotes.BTC.price,
	}
	console.log(
		shouldBuy(
			state.ordersSellBtcUahUA.max_price,
			state.ordersBuyCoinUahUA.min_price,
			state.coefficientCoinBtcBN)
		);
	// console.log(state, 'state');
}

//helpers
function convertToUSD(priceHRN) {
	return priceHRN / USD_RATE;
}

function percentFromX(percent, amount) {
	return amount * percent / 100;
}

/**
* param {String} pair ex: 'btc_uah' (predefined)
* param {String} action ex: 'buy' or 'sell'
*/
function fetchPairOrders(pair, action) {
	return fetch('https://btc-trade.com.ua/api/trades/' + action + '/' + pair)
		.then(response => response.text())
		.catch((e) => {console.log('e', e)})
		.then(response => JSON.parse(response))
		.catch((e) => {console.log('e', e)})
}

// TODO add error handler
function getCoinPrice() {
	return fetch('https://api.coinmarketcap.com/v2/ticker/?convert=BTC&limit=2')
		.then(response => response.text())
		.then(response => JSON.parse(response))
}

function shouldBuy(btcSellPriceUA, coinBuyPriceUA, coefficientCoinBtcBN) {
	const coefficientBtcCoinUA = coinBuyPriceUA / btcSellPriceUA;

/*	console.log(coefficientBtcCoinUA, 'coefficientBtcCoinUA');
	console.log(coefficientCoinBtcBN, 'coefficientCoinBtcBN');*/

	const coefficients = [coefficientBtcCoinUA, coefficientCoinBtcBN].sort();


	const margin = 100 - (coefficients[0] * 100 / coefficients[1]);
	const pureMargin = margin - CYLCE_EXPENSES_PERCENT;

	if (!isNaN(coefficients[0]) && !isNaN(coefficients[1])) {
		logs.push(pureMargin.toFixed(3));
	}
	if (pureMargin > EXPECTED_PERCENT_PURE_INCOME) {

		/*return `Buy, income % = ${pureMargin}`;*/
	} else {
		/*return `Not buy, income % = ${pureMargin}`;*/
	}
	return logs;
}

/*console.log(PURE_INCOME, 'p. i.');*/







// current schema 
//  BTC -> HRN  -->    HRN -> COIN ------> COIN -> BTC
//  ^                                               
// | |                                             | |
//                                                  v
//     <--------------------------------------------
// 5 % diff must be in BTC


// Primary purpose: write analyser for 1 coin with minimum hardcoded constants. Test on real money.
/*
primary todo:
- add error handler probably just for btc trade ua 
- add one more coin analyzer
*/