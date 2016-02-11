/**
 * Created by kraigm on 2/10/16.
 */

var Loader = require('./loader.js');
var npm = require('./npm.js');

var getLatestHomeBridgeVersionAsync = function(log) {
	return npm.init()
		.then(function(){
			var id = "homebridge";
			log.debug("Refreshing npm data for : " + id);
			return npm.view(id, 'version');
		});
};

module.exports = {
	getLatestHomeBridgeVersionAsync: getLatestHomeBridgeVersionAsync
};

module.exports.api = {};
module.exports.api.get = function(hb, req, log) {
	var pkg = Loader.pkg;
	return getLatestHomeBridgeVersionAsync(log)
		.then(function(version){
			return {
				Type: 1,
				Info: {
					Version: pkg.version,
					LatestVersion: version
				}
			};
		});
};
