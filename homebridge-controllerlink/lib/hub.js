/**
 * Created by kraigm on 2/10/16.
 */

var Loader = require('./loader.js');
var Config = require('./config');
var npm = require('./npm.js');
var installq = require('./installq');
var InstallStatusType = installq.StatusType;
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var os = require('./os');
var semver = require('semver');
var fsAsync = {
	readFileAsync: Promise.promisify(fs.readFile)
};
var hubModuleId = "homebridge";

var getHubPackageFilePath = function() {
	var pkgDir = Loader.ModuleDirectory;
	var pkgPath = path.join(pkgDir, 'package.json');
	return pkgPath;
};

var getHubPackageInfoAsync = function(log) {
	var pkgPath = getHubPackageFilePath();
	return fsAsync.readFileAsync(pkgPath)
		.then(parseHubPackageInfo);
};

var getHubPackageInfoSync = function() {
	var pkgPath = getHubPackageFilePath();
	var file = fs.readFileSync(pkgPath);
	return parseHubPackageInfo(file);
};

var parseHubPackageInfo = function(file) {
	var pkgFile = file.toString();
	return JSON.parse(pkgFile);
};

var initHubData = getHubPackageInfoSync();
var ensureHubVersion = function(query) {
	return semver.satisfies(initHubData.version, query);
};

var getLatestHomeBridgeVersionAsync = function(log) {
	return npm.init()
		.then(function(){
			var id = hubModuleId;
			log.debug("Refreshing npm data for : " + id);
			return npm.view(id, 'version');
		});
};

var getLinkVersionAsync = function(log) {
	var pkgDir = path.dirname(module.filename);
	var pkgPath = path.join(pkgDir, '..', 'package.json');
	return fsAsync.readFileAsync(pkgPath)
		.then(function(file){
			var pkgFile = file.toString();
			return JSON.parse(pkgFile);
		});
};

var getHubInfoAsync = function(hb, log) {
	return Promise.all([
		getHubPackageInfoAsync(log),
		getLatestHomeBridgeVersionAsync(log),
		Promise.resolve(new Config(hb)),
		getLinkVersionAsync()
	])
		.then(function(results){
			var id = results[2].bridge.username;
			id = id && id.toUpperCase().replace(/:/g, '');
			return {
				Id: id,
				Name: results[2].bridge.name,
				OS: os.current.Type,
				Version: results[0].version,
				LinkVersion: results[3].version,
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
			return installq.enqueue(id, options, log);
		});
};

module.exports = {
	installHubUpdateAsync: installHubUpdateAsync,
	getHubInfoAsync: getHubInfoAsync,
	ensureHubVersion: ensureHubVersion,
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
	return installHubUpdateAsync({
		version: req && req.body && req.body.Version
	}, log)
		.then(function (stat) {
			if (!stat || !stat.status) {
				return {
					Type: 2,
					Message: "Failed to start installation",
					FullError: "No status object returned from installHubUpdateAsync"
				};
			}
			if (stat.status == InstallStatusType.Error) {
				return {
					Type: 2,
					Message: "Installation failed",
					FullError: stat.error && (stat.error.stack || stat.error.message || stat.error)
				};
			}
			return {
				Type: 1,
				InstallStatusKey: stat.status != InstallStatusType.Success ? hubModuleId : null
			};
		});
};
