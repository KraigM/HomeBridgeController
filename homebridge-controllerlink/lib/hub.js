/**
 * Created by kraigm on 2/10/16.
 */

var Loader = require('./loader.js');
var Config = require('./config');
var npm = require('./npm.js');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var os = require('./os');
var fsAsync = {
	readFileAsync: Promise.promisify(fs.readFile)
};
var hubModuleId = "homebridge";

var getHubPackageInfoAsync = function(log) {
	var pkgDir = Loader.ModuleDirectory;
	var pkgPath = path.join(pkgDir, 'package.json');
	return fsAsync.readFileAsync(pkgPath)
		.then(function(file){
			var pkgFile = file.toString();
			return JSON.parse(pkgFile);
		});
};

var getLatestHomeBridgeVersionAsync = function(log) {
	return npm.init()
		.then(function(){
			var id = hubModuleId;
			log.debug("Refreshing npm data for : " + id);
			return npm.view(id, 'version');
		});
};

var getHubInfoAsync = function(hb, log) {
	return Promise.all([
		getHubPackageInfoAsync(log),
		getLatestHomeBridgeVersionAsync(log),
		Promise.resolve(new Config(hb))
	])
		.then(function(results){
			return {
				Name: results[2].bridge.name,
				OS: os.current.Type,
				Version: results[0].version,
				LatestVersion: results[1]
			};
		});
};

var installHubUpdateAsync = function(options, log) {
	var id = hubModuleId;
	if (options && !log && typeof options === 'function') {
		log = options;
		options = null;
	}
	if (!options) {
		options = {};
	}

	var pkgDir = Loader.ModuleDirectory;
	if (!pkgDir || !fs.existsSync(pkgDir)){
		throw new Error("Invalid HomeBridge module directory");
	}

	var pkgParent = path.resolve(path.join(pkgDir, '..'));
	var pkgRoot = pkgParent && path.resolve(path.join(pkgParent, '..'));
	if (!pkgParent || !pkgRoot || path.basename(pkgParent) != 'node_modules') {
		throw new Error("HomeBridge must be installed via npm in order to upgrade");
	}

	return npm.init()
		.then(function(){
			log.debug("Installing " + id + " plugin at " + pkgDir);
			options.path = pkgRoot;
			return npm.install(id, options, log);
		});
};

module.exports = {
	installHubUpdateAsync: installHubUpdateAsync,
	getHubInfoAsync: getHubInfoAsync,
	getLatestHomeBridgeVersionAsync: getLatestHomeBridgeVersionAsync
};

module.exports.api = {};
module.exports.api.get = function(hb, req, log) {
	return getHubInfoAsync(hb, log)
		.then(function(info){
			return {
				Type: 1,
				Info: info
			};
		});
};
module.exports.api.installAsync = function (hb, req, log) {
	var rtn;
	return installHubUpdateAsync({
		version: req && req.body && req.body.Version
	}, log)
		.then(function (modules) {
			rtn = {
				Type: 1,
				InstalledModules: modules
			};
			return getHubInfoAsync(hb, log);
		})
		.then(function(info){
			rtn.Info = info;
			return rtn;
		});
};
