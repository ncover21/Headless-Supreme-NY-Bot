const request = require('request');
const http = require('http');
const chalk = require('chalk');
const payloads = require('./payloads.json');
const time = require('time');

const calls = require('./jsonCalls.js');
const tools = require('./tools.js');
//const demoStock = require('./newStockList.json');
const checkout = require('./checkout.js');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const parse = require('url-parse');
const colors = require('colors');
const moment = require('moment');
var fs = require('fs');
const config = require('./config');


var TWO_MINS = 110 * 1000;/* LOL @ Anybody that actually contribute this is 1min and 50 seconds too risky to make it 2 mins */

const lessThanTwoMinsAgo = (date) => {
    return moment(date).isBefore(moment().subtract(TWO_MINS, 'ms'));
}
var tokens = []
var harvestedToken = 0
var sitekey;

module.exports = {
	getTokens: function(){
		return tokens;
	},
	getAToken: function(){
		var aToken;
		if(tokens.length > 0){	
			aToken = tokens[tokens.length-1];
			tokens.pop();
			return aToken;
		}else{
			return "";
		}
		

	},
	startServer: function(){
	app.set('port', process.env.PORT || 3000);
	app.set('view engine', 'ejs');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.set('views', path.join(__dirname, 'views'));

	log('info', `Using Sitekey Provided (${config.sitekey})`);

	app.get('/harvest', function(req, res) {
	  return res.render('index', {
	    count: harvestedToken,
	    sitekey: config.sitekey,
	    url: parse(config.host).hostname
	  });
	});

	app.get('/usable_tokens', function(req, res) {
	  return res.json(tokens);
	});

	app.post('/submit', function(req, res) {
	  harvestedToken += 1
	  log('info', `Successful Token: ${req.body['g-recaptcha-response']}`);
	  tokens.push({
	    token: req.body['g-recaptcha-response'],
	    timestamp: moment()
	  })
	  return res.redirect(`${config.host}:3000/harvest`);
	});

	var loop = setInterval(function() {
	  for (var i=0; i < tokens.length; i++) {
	    var tokenDate = Date.parse(tokens[i].timestamp);
	    if (lessThanTwoMinsAgo(tokens[i].timestamp)) {
	      log('error', `Token Expired (${tokens[i].token})`)
	      tokens.splice(i, 1);
	    }
	  }
	}, 0);

	app.listen(app.get('port'), () => {
	  log('success', `Server Harvester started @ ${config.host}:3000/harvest`)
	});
}

}

var log = function(type, text) {

  var date = new Date()
  var formatted = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")

  switch (type) {
    case "warning":
      console.log(`[${formatted}] ${text}`.yellow)
      break;
    case "error":
      console.log(`[${formatted}] ${text}`.red)
      break;
    case "info":
      console.log(`[${formatted}] ${text}`.cyan)
      break;
    case "success":
      console.log(`[${formatted}] ${text}`.green)
      break;

    default:
      console.log(`[${formatted}] ${text}`.white)
  }
}


