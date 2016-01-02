var Loader = require('./loader.js');
var Plugin = Loader.Plugin;
var API = Loader.API;
var version = require('./version.js');

var cache;

module.exports = function() {
	if (cache) {
		return cache;
	}

	var plugins = {};
	var pluginErrors = {};
	var api = new API();

	// load and validate plugins - check for valid package.json, etc.
	Plugin.installed().forEach(function(plugin) {

		// attempt to load it
		try {
			plugin.load();
		}
		catch (err) {
			pluginErrors[plugin.name()] = err;
			return;
		}

		// call the plugin's initializer and pass it our API instance
		plugin.initializer(api);

		var info = { };
		info.Path = plugin.pluginPath;
		info.Version = version(info.Path);
		plugins[plugin.name()] = info;

	}.bind(this));

	cache = {
		Plugins: plugins,
		PluginErrors: pluginErrors
	};
	return cache;
};