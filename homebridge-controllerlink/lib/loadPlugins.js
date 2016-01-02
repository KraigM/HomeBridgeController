var Loader = require('./loader.js');
var Plugin = Loader.Plugin;
var API = Loader.API;
var version = require('./version.js');

var cache;

module.exports = function() {
	if (cache) {
		return cache;
	}

	var plugins = [];
	var pluginErrors = {};
	var api = new API();
	var accList;
	var platList;

	api.registerAccessoryBase = api.registerAccessory;
	api.registerAccessory = function(pluginName, accessoryName) {
		this.registerAccessoryBase.apply(this, arguments);
		accList.push(accessoryName);
	}.bind(api);

	api.registerPlatformBase = api.registerPlatform;
	api.registerPlatform = function(pluginName, platformName) {
		this.registerPlatformBase.apply(this, arguments);
		platList.push(platformName);
	}.bind(api);

	// load and validate plugins - check for valid package.json, etc.
	Plugin.installed().forEach(function(plugin) {
		accList = [];
		platList = [];

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
		info.Name = plugin.name();
		info.Accessories = accList;
		info.Platforms = platList;
		plugins.push(info);

	}.bind(this));

	cache = {
		Plugins: plugins,
		PluginErrors: pluginErrors
	};
	return cache;
};