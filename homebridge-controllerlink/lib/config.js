/**
 * Created by kraigm on 1/1/16.
 */

var Loader = require('./loader.js');
var fs = require('fs');

// Look for the configuration file
var getConfigPath = function (homebridgeOrPath) {
	if (typeof homebridgeOrPath === 'string' || homebridgeOrPath instanceof String) {
		return homebridgeOrPath;
	}
	var User = homebridgeOrPath ? homebridgeOrPath.user : Loader.User;
	return User && User.configPath();
};

// Complain and exit if it doesn't exist yet
var ensureConfigFile = function (configPath) {
	if (!fs.existsSync(configPath)) {
		throw new Error("Couldn't find a config.json file at '" + configPath + "'. Look at config-sample.json for examples of how to format your config.js and add your home accessories.");
	}
};

// Load up the configuration file
var readConfigFile = function (configPath) {
	ensureConfigFile(configPath);

	try {
		return JSON.parse(fs.readFileSync(configPath));
	}
	catch (err) {
		throw new Error("There was a problem reading your config.json file.\nPlease try pasting your config.json file here to validate it: http://jsonlint.com\n" + err);
	}
};

var copyData = function(from, to) {
	for (var prop in from) {
		to[prop] = from[prop];
	}
};

var replaceData = function(from, to) {
	for (var prop in to) {
		if (from.hasOwnProperty(prop)) {
			to[prop] = from[prop];
			delete from[prop];
		} else {
			delete to[prop];
		}
	}
	copyData(from, to);
};

function Config(homebridgeOrPath, data) {
	var configPath = getConfigPath(homebridgeOrPath);
	if (!data) {
		data = readConfigFile(configPath);
	}
	copyData(data, this);
	this._filePath = configPath;
}

Config.prototype.updateAllData = function (data) {
	var origPath = this._filePath;
	try {
		replaceData(data, this);
	} finally {
		this._filePath = origPath;
	}
};

Config.prototype.save = function (path) {
	var origPath = this._filePath;

	path = path || this._filePath;
	if (!path) {
		throw new Error("You must specify a path");
	}

	var json;
	delete this._filePath;
	try {
		json = JSON.stringify(this, null, '\t');
	} catch (err) {
		this._filePath = origPath;
	}

	fs.writeFileSync(path, json);

	if (!this._filePath) {
		this._filePath = path;
	}
};

Config.loadDefault = function (homebridge) {
	var configPath = getConfigPath(homebridge);
	if (!configPath) {
		throw new Error("Could not locate default config");
	}
	return new Config(configPath);
};

Config.api = {};
Config.api.get = function (homebridge) {
	return {
		Type: 1,
		Config: Config.loadDefault(homebridge)
	};
};
Config.api.put = function (homebridge, req) {
	var updatedConfig = req && req.body && req.body.Config;
	if (!updatedConfig) {
		return {
			Type: 2,
			Message: "You must specify a config to save"
		};
	}
	var config = new Config(homebridge, updatedConfig);
	config.save();
	return Config.api.get(homebridge);
};

module.exports = Config;
