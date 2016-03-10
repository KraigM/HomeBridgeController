var Loader = require('./loader.js');
var Plugin = Loader.Plugin;
var API = Loader.API;
var version = require('./version.js');
var npm = require('./npm');
var installq = require('./installq');
var InstallStatusType = installq.StatusType;
var Promise = require('bluebird');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var cache;

var loadPlugins = function () {
	if (cache) {
		return cache;
	}

	var plugins = [];
	var pluginErrors = {};
	var api = new API();
	var accList;
	var platList;

	api.registerAccessoryBase = api.registerAccessory;
	api.registerAccessory = function (pluginName, accessoryName) {
		this.registerAccessoryBase.apply(this, arguments);
		accList.push(accessoryName);
	}.bind(api);

	api.registerPlatformBase = api.registerPlatform;
	api.registerPlatform = function (pluginName, platformName) {
		this.registerPlatformBase.apply(this, arguments);
		platList.push(platformName);
	}.bind(api);

	// load and validate plugins - check for valid package.json, etc.
	var installedPlugins = Plugin.installed();
	installedPlugins.forEach(function (plugin) {
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

		var pkgPath = path.join(plugin.pluginPath, 'package.json');
		var pkgFile = fs.readFileSync(pkgPath).toString();
		var pkgMeta = JSON.parse(pkgFile);
		var info = formatRawPluginData(pkgMeta);

		info.Path = plugin.pluginPath;

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

var availablePlugins = { };
var getAvailablePluginsAsync = function(hb, req, log) {
	var task = Promise.resolve(true);

	var minutesFromLastReload = Math.floor((new Date() - availablePlugins.LastReload) / 1000 / 60);
	var needsReload = !availablePlugins || !availablePlugins.Known || minutesFromLastReload > 30;
	if (needsReload) {
		task = task.then(function(){
			return reloadAvailablePluginsAsync(log);
		});
	}

	var secondsFromLastRefresh = Math.floor((new Date() - availablePlugins.LastRefresh) / 1000);
	var needsRefresh = needsReload || !availablePlugins.Data || secondsFromLastRefresh > 10;
	if (needsRefresh) {
		task = task.then(function(){
			return refreshAvailablePluginsAsync(log);
		});
	}

	return task.then(formatAvailablePlugins);
};
var formatAvailablePlugins = function() {
	var data = availablePlugins.Data;
	var arr = [];
	for (var k in data) {
		arr.push(formatRawPluginData(data[k]));
	}
	return {
		AvailablePlugins: arr
	};
};
var formatRawPluginData = function(data) {
	return data && {
		Name: data.name,
		Description: data.description,
		Version: data.version,
		HomePage: data.homepage
	};
};

var refreshAvailablePluginsAsync = function(log) {
	return npm.init()
		.then(function(){
			return Promise.map(availablePlugins.Known, function(id) {
				log.debug("Refreshing npm data for : " + id);
				return npm.view(id)
					.then(function(data) {
						if (!availablePlugins.Data) availablePlugins.Data = {};
						availablePlugins.Data[id] = data;
					});
			});
		})
		.then(function(){
			availablePlugins.LastRefresh = Date.now();
			log.debug("Finished refreshAvailablePluginsAsync");
		});
};

var reloadAvailablePluginsAsync = function(log){
	return npm.search('homebridge-plugin')
		.then(function(ids){
			availablePlugins.Known = ids;
			availablePlugins.LastReload = Date.now();
			log.debug('Available Plugins Search Results : ' + JSON.stringify(ids));
		});
};

var installPluginAsync = function(plugin, options, log) {
	if (options && !log && typeof options === 'function') {
		log = options;
		options = null;
	}
	if (!options){
		options = {};
	}
	var installDirTask = determineInstallDirAsync(plugin, options, log);
	return npm.init()
		.then(function(){
			return installDirTask;
		})
		.then(function(pkgDir){
			log.debug("Installing " + plugin + " plugin at " + pkgDir);
			options.path = pkgDir;
			var stat = installq.enqueue(plugin, options, log);
			var task = stat.task;
			if (task) {
				task.finally(function(){
					if (stat.didInstall) cache = null;
					//if (!availablePlugins.Data) availablePlugins.Data = {};
					//availablePlugins.Data[plugin] = data;
					log.debug("Finished installPluginAsync");
				})
			}
			return stat;
		});
};

var strEndsWith;
if (typeof String.prototype.endsWith !== 'function') {
	strEndsWith = function(str, suffix) {
		return str.indexOf(suffix, this.length - suffix.length) !== -1;
	};
} else {
	strEndsWith = function(str, suffix) {
		return str.endsWith(suffix);
	};
}

var determineInstallDirAsync = function(plugin, options, log) {
	return new Promise(function(resolve,reject){
		var checkDir = function(dir, modulesOptional) {
			if (!dir) return false;
			try {
				dir = path.resolve(dir);
			} catch (err) {
				log.debug("Error checking path (" + dir + "): "+ err);
				return false;
			}
			if (strEndsWith(dir, '/')) {
				dir = dir.substr(0, dir.length - 1);
			}
			if (strEndsWith(dir, '/node_modules')) {
				dir = dir + '/..';
			} else if (!modulesOptional) {
				return false;
			}
			resolve(path.resolve(dir));
			return true;
		};

		// Always use current path if already installed
		var res = loadPlugins();
		var currentPlugins = res && res.Plugins;
		if (currentPlugins && currentPlugins.length > 0) {
			var cur = _.find(currentPlugins, function(p) { return p.Name == plugin; });
			if (cur && cur.Path) {
				if (checkDir(cur.Path + "/..")) return;
			}
		}

		// If specified, use options path
		if (options.path && checkDir(options.path, true)) return;

		// Fallback to this plugin's install dir
		if (!checkDir(__dirname + "/../..", true)) {
			reject(new Error("Unable to determine install path"));
		}
	});
};

module.exports = {
	loadPlugins: loadPlugins,
	installPluginAsync: installPluginAsync,
	getAvailablePluginsAsync: getAvailablePluginsAsync
};

module.exports.api = { };
module.exports.api.get = loadPlugins;
module.exports.api.getAvailableAsync = getAvailablePluginsAsync;
module.exports.api.installAsync = function (homebridge, req, log) {
	var plugin = req && req.body && req.body.Plugin;
	if (!plugin) {
		return {
			Type: 2,
			Message: "You must specify a plugin to install or update"
		};
	}
	return installPluginAsync(plugin, {
		version: req.body.Version
	}, log)
		.then(function (stat) {
			if (!stat || !stat.status) {
				return {
					Type: 2,
					Message: "Failed to start installation",
					FullError: "No status object returned from installPluginAsync"
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
				InstallStatusKey: stat.status != InstallStatusType.Success ? plugin : null
			};
		});
};
