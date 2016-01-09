/**
 * Created by kraigm on 1/1/16.
 */

var express = require('express');
var mdns = require('mdns');
var loadPlugins = require('./loadPlugins.js');
var config = require('./config.js');
var Auth = require('./auth.js');

module.exports = Server;

function Server(homebridge, port, accessKey, log) {
	this.homebridge = homebridge;
	this.port = port || 51828;
	this.log = log;
	this.debug = log.debug;
	var auth = new Auth(accessKey);
	this.auth = auth;

	var app = express();

	var jsonRtn = function (func) {
		return function (req, res) {
			var rtn;
			try {
				if (!this.auth.verifyToken(req.headers.token)) {
					res.status(401);
					rtn = {
						Type: 2,
						FullError: "Not authorized"
					};
				} else {
					rtn = func.bind(this)(this.homebridge);
					rtn.Type = 1;
				}
			}
			catch (err) {
				rtn = {
					Type: 2,
					FullError: err
				};
			}
			res.send(rtn);
		}.bind(this);
	}.bind(this);

	app.get('/loadPlugins', jsonRtn(loadPlugins));
	app.get('/config', jsonRtn(config.get));

	this.app = app;
}

Server.prototype.start = function () {
	this.server = this.app.listen(this.port, function () {
		var port = this.server.address().port;
		var key = 'hbctrllink';
		mdns.createAdvertisement(mdns.tcp(key), port).start();
		this.debug("Advertised HomeBridgeControllerLink (" + key + ") at port " + port);
		this.log("Started HomeBridgeControllerLink on port " + port);
	}.bind(this));
};

