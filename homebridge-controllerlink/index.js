/**
 * Created by kraigm on 1/1/16.
 */

var HomeBridge;
var Server = require('./lib/Server.js');

module.exports = function (homebridge) {
	HomeBridge = homebridge;
	homebridge.registerPlatform("homebridge-controllerlink", "HomeBridgeControllerLink", HomeBridgeControllerLink);
};

function HomeBridgeControllerLink(log, config) {
	this.log = log;
	this.debug = log.debug;
}

HomeBridgeControllerLink.prototype = {
	accessories: function (callback) {
		this.server = new Server(HomeBridge, null, this.log);
		this.server.start();
		callback([]);
	}
};