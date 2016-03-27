/**
 * Created by kraigm on 1/1/16.
 */

var HomeBridge;
var Server = require('./lib/server.js');
var Config = require('./lib/config');

module.exports = function (homebridge) {
	HomeBridge = homebridge;
	homebridge.registerPlatform("homebridge-controllerlink", "HomeBridgeControllerLink", HomeBridgeControllerLink);
};

function HomeBridgeControllerLink(log, config) {
	this.log = log;
	this.debug = log.debug;

	var accessKey = config["accessKey"];
	if (!accessKey) {
		var serverConfig = new Config(HomeBridge);
		accessKey = serverConfig && serverConfig.bridge && serverConfig.bridge.pin;
	}

	if (!accessKey) {
		this.log.error("Unable to load server config.  Link will not be established");
		return;
	}

	this.server = new Server(HomeBridge, config["port"], accessKey, this.log, config);
}

HomeBridgeControllerLink.prototype = {
	accessories: function (callback) {
		this.server.startAsync()
			.catch(function(err){
				this.log.error(err);
			}.bind(this))
			.return([])
			.then(callback);
	}
};