/**
 * Created by kraigm on 1/1/16.
 */

var express = require('express');
var mdns = require('mdns');
var plugins = require('./plugins');
var Config = require('./config');
var Auth = require('./auth.js');
//var Logger = require('./logger');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var Hub = require('./hub');

//var logger = new Logger();

module.exports = Server;

function Server(homebridge, port, accessKey, log) {
	this.homebridge = homebridge;
	this.port = port || 51828;
	this.log = log;
	this.debug = log.debug;
	var auth = new Auth(accessKey);
	this.auth = auth;

	var app = express();

	app.use(bodyParser.json());

	var jsonRtn = function (func) {
		var self = this;
		return function (req, res) {
			new Promise(function(resolve, reject){
				if (!self.auth.verifyToken(req && req.headers && req.headers.token)) {
					res.status(401);
					reject("Not authorized");
				} else {
					resolve(func.bind(self)(self.homebridge, req, self.log));
				}
			})
				.then(function(rtn){
					if (rtn && !rtn.Type) {
						rtn.Type = 1;
					}
					return rtn;
				})
				.catch(function(err){
					var rtn = {
						Type: 2
					};
					if (err instanceof String) {
						rtn.Message = err;
					} else if (err) {
						rtn.Type = err.Type || rtn.Type;
						rtn.Message = err.message || err.Message;
						rtn.FullError = err.FullError || err.stack;
					}
					return rtn;
				})
				.done(function(rtn){
					res.send(rtn);
				});
		};
	}.bind(this);

	app.get('/plugins', jsonRtn(plugins.api.get));
	app.post('/plugins', jsonRtn(plugins.api.installAsync));
	app.get('/plugins/available', jsonRtn(plugins.api.getAvailableAsync));
	app.get('/config', jsonRtn(Config.api.get));
	app.post('/config', jsonRtn(Config.api.put));
	app.get('/hub', jsonRtn(Hub.api.get));
	app.post('/hub', jsonRtn(Hub.api.installAsync));
	app.get('/ping', jsonRtn(function(){ return {}; }));

	this.app = app;
}

var listenAsync = function(app, port) {
	return new Promise(function(resolve, reject){
		var server = app.listen(port, function() {
			resolve(server);
		});
	});
};

Server.prototype.start = function () {
	this.startAsync();
};
Server.prototype.startAsync = function() {
	var self = this;
	return Promise.all([
		listenAsync(this.app, this.port),
		Hub.getHubInfoAsync(this.log)
	])
		.then(function(results) {
			self.server = results[0];
			var port = self.server.address().port;
			self.log("Started HomeBridgeControllerLink on port " + port);

			var info = results[1];
			const key = 'hbctrllink';
			mdns.createAdvertisement(mdns.tcp(key), port, {
				txtRecord: info
			}).start();
			self.debug("Advertised HomeBridgeControllerLink (" + key + ") at port " + port);
		});
};

