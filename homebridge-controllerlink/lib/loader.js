/**
 * Created by kraigm on 1/1/16.
 */

var Path = require('path');

function findModuleParent(mod, pred) {
	while(mod){
		if (pred(mod)) {
			return mod;
		}
		mod = mod.parent;
	}
}

function findLibDirectory() {
	var PluginModule = findModuleParent(module, function(mod){
		return mod.exports.Plugin && mod.exports.Plugin.name == 'Plugin';
	});
	if (PluginModule) {
		return Path.dirname(PluginModule.filename);
	}
	return Path.join('homebridge', 'lib');
}

var lib = findLibDirectory();

module.exports = {
	Plugin: require(Path.join(lib, 'plugin.js')).Plugin,
	API: require(Path.join(lib, 'api.js')).API,
	User: require(Path.join(lib, 'user.js')).User
};