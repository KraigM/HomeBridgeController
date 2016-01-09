/**
 * Created by kraigm on 1/1/16.
 */

var Loader = require('./loader.js');
var fs = require('fs');

var getConfig = function(homebridge) {
	var User = homebridge ? homebridge.user : Loader.User;

	// Look for the configuration file
	var configPath = User.configPath();

	// Complain and exit if it doesn't exist yet
	if (!fs.existsSync(configPath)) {
		throw new Error("Couldn't find a config.json file at '" + configPath + "'. Look at config-sample.json for examples of how to format your config.js and add your home accessories.");
	}

	// Load up the configuration file
	var config;
	try {
		config = JSON.parse(fs.readFileSync(configPath));
	}
	catch (err) {
		throw new Error("There was a problem reading your config.json file.\nPlease try pasting your config.json file here to validate it: http://jsonlint.com\n" + err);
	}

	return {
		Config: config
	};
};

var getBridge = function(config) {
	var cfg = config.Config || getConfig(config).Config;
	return cfg && cfg.bridge;
};

var getBridgePin = function(config) {
	var bdgCfg = getBridge(config);
	return bdgCfg && bdgCfg.pin;
};

module.exports = {
	get: getConfig,
	getBridgePin: getBridgePin
};