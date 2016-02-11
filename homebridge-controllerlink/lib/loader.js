/**
 * Created by kraigm on 1/1/16.
 */

var Path = require('path');
var fs = require('fs');

function findModuleParent(mod, pred) {
	while (mod) {
		if (pred(mod)) {
			return mod;
		}
		mod = mod.parent;
	}
}

function findLibDirectory() {
	var PluginModule = findModuleParent(module, function (mod) {
		return mod.exports.Plugin && mod.exports.Plugin.name == 'Plugin';
	});
	if (PluginModule) {
		return Path.dirname(PluginModule.filename);
	}
	return Path.join('homebridge', 'lib');
}

var lib = findLibDirectory();

var pkgPath = Path.join(lib, '..', 'package.json');
var pkgFile = fs.readFileSync(pkgPath).toString();
var pkg = JSON.parse(pkgFile);

module.exports = {
	pkg: pkg,
	Plugin: require(Path.join(lib, 'plugin.js')).Plugin,
	API: require(Path.join(lib, 'api.js')).API,
	User: require(Path.join(lib, 'user.js')).User
};