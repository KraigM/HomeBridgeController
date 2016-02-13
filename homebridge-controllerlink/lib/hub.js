/**
 * Created by kraigm on 2/10/16.
 */

var Loader = require('./loader.js');
var npm = require('./npm.js');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var fsAsync = {
	readFileAsync: Promise.promisify(fs.readFile)
};

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
			var id = "homebridge";
			log.debug("Refreshing npm data for : " + id);
			return npm.view(id, 'version');
		});
};

var getHubInfoAsync = function(log) {
	return Promise.all([
		getHubPackageInfoAsync(log),
		getLatestHomeBridgeVersionAsync(log)
	])
		.then(function(version){
			return {
				Version: version[0].version,
				LatestVersion: version[1]
			};
		});
};

module.exports = {
	getHubInfoAsync: getHubInfoAsync,
	getLatestHomeBridgeVersionAsync: getLatestHomeBridgeVersionAsync
};

module.exports.api = {};
module.exports.api.get = function(hb, req, log) {
	return getHubInfoAsync(log)
		.then(function(info){
			return {
				Type: 1,
				Info: info
			};
		});
};
