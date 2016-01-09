/**
 * Created by kraigm on 1/1/16.
 */

var Loader = require('./loader.js');
var fs = require('fs');

// Look for the configuration file
var getConfigPath = function(homebridge) {
	var User = homebridge ? homebridge.user : Loader.User;
	return User && User.configPath();
};

// Complain and exit if it doesn't exist yet
var ensureConfigFile = function(configPath) {
	if (!fs.existsSync(configPath)) {
		throw new Error("Couldn't find a config.json file at '" + configPath + "'. Look at config-sample.json for examples of how to format your config.js and add your home accessories.");
	}
};

// Load up the configuration file
var readConfigFile = function(configPath) {
	ensureConfigFile(configPath);

	try {
		return JSON.parse(fs.readFileSync(configPath));
	}
	catch (err) {
		throw new Error("There was a problem reading your config.json file.\nPlease try pasting your config.json file here to validate it: http://jsonlint.com\n" + err);
	}
};

var getConfig = function(homebridge) {
	var configPath = getConfigPath(homebridge);
	var config = readConfigFile(configPath);
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
