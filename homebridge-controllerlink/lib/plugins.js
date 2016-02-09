var Loader = require('./loader.js');
var Plugin = Loader.Plugin;
var API = Loader.API;
var version = require('./version.js');
var npm = require('./npm');
var Promise = require('bluebird');
var _ = require('lodash');
var path = require('path');

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

		var info = {};
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

var availablePlugins = {
	Known: [
		'homebridge-alarmdotcom',
		'homebridge-applescript',
		'homebridge-assurelink',
		'homebridge-better-http-rgb',
		'homebridge-cmd',
		'homebridge-connectedbytcp',
		'homebridge-controllerlink',
		'homebridge-domotiga',
		'homebridge-ds18b20',
		'homebridge-dummy',
		'homebridge-ecoplug',
		'homebridge-envisakit',
		'homebridge-envisalink',
		'homebridge-fakebulb',
		'homebridge-fhem',
		'homebridge-fibaro-hc2',
		'homebridge-filesensor',
		'homebridge-flowerpower',
		'homebridge-fritzbox',
		'homebridge-globalcache-gc100',
		'homebridge-globalcache-itach',
		'homebridge-harmonyhub',
		'homebridge-homematic',
		'homebridge-homewizard',
		'homebridge-http',
		'homebridge-http-jeedom',
		'homebridge-http-rgb',
		'homebridge-http-temperature-humidity',
		'homebridge-http-thermostat',
		'homebridge-httptemperaturehumidity',
		'homebridge-humidity-file',
		'homebridge-hyperion',
		'homebridge-icontrol',
		'homebridge-ifttt',
		'homebridge-indigo',
		'homebridge-inspire-home-automation-boost',
		'homebridge-irkit',
		'homebridge-isy-js',
		'homebridge-kevo',
		'homebridge-knx',
		'homebridge-legacy-plugins',
		'homebridge-liftmaster',
		'homebridge-lifx',
		'homebridge-lifx-lan',
		'homebridge-lightwaverf',
		'homebridge-lockitron',
		'homebridge-lomsnvlight',
		'homebridge-lomwindow',
		'homebridge-lono',
		'homebridge-loxone',
		'homebridge-melcloud',
		'homebridge-midi',
		'homebridge-milight',
		'homebridge-misfit-bolt',
		'homebridge-mqttswitch',
		'homebridge-mystrom',
		'homebridge-nefit-easy',
		'homebridge-nest',
		'homebridge-netatmo',
		'homebridge-ninjablock-alarmstatedevice',
		'homebridge-ninjablock-humidity',
		'homebridge-ninjablock-temperature',
		'homebridge-openhab',
		'homebridge-openremote',
		'homebridge-philipshue',
		'homebridge-pilight',
		'homebridge-platform-wemo',
		'homebridge-punt',
		'homebridge-qmotion',
		'homebridge-rasppi-gpio-garagedoor',
		'homebridge-rcswitch',
		'homebridge-rcswitch-gpiomem',
		'homebridge-readablehttp',
		'homebridge-samsungtv',
		'homebridge-smtpsensor',
		'homebridge-sonos',
		'homebridge-sonytv',
		'homebridge-soundtouch',
		'homebridge-ssh',
		'homebridge-symcon',
		'homebridge-telldus',
		'homebridge-temperature-file',
		'homebridge-thermostat',
		'homebridge-thinkingcleaner',
		'homebridge-vcontrold',
		'homebridge-vera',
		'homebridge-wakeonlan',
		'homebridge-wemo',
		'homebridge-wink',
		'homebridge-wireless-sensor-tag',
		'homebridge-wol',
		'homebridge-wunderground',
		'homebridge-yamaha',
		'homebridge-zway'
	]
};
var getAvailablePluginsAsync = function(hb, req, log) {
	var task;
	if (!availablePlugins || !availablePlugins.Known) {
		task = reloadAvailablePluginsAsync(log);
	} else {
		var secondsFromLastRefresh = Math.floor((new Date() - availablePlugins.LastRefresh) / 1000);
		if (!availablePlugins.Data || secondsFromLastRefresh > 10) {
			task = refreshAvailablePluginsAsync(log);
		}
	}
	return task ? task.then(formatAvailablePlugins) : formatAvailablePlugins();
};
var formatAvailablePlugins = function() {
	var data = availablePlugins.Data;
	var arr = [];
	for (var k in data) {
		arr.push(data[k]);
	}
	return {
		AvailablePlugins: arr
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
			log.debug("Finished refreshAvailablePluginsAsync");
		});
};

var reloadAvailablePluginsAsync = function(log){
	return npmInitAsync(log, function(resolve, reject) {
		var searchFn = npm.commands.search;
		var args = ['homebridge-plugin'];
		var cb = function (err, data) {
			if (err) return reject(err);
			availablePlugins.Known = data.keys;
			availablePlugins.Data = data;
			availablePlugins.LastRefresh = Date.now();
			resolve();
		};
		searchFn(args,cb);
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
			return npm.install(plugin, options, log);
		})
		.then(function(didInstall) {
			if (didInstall) cache = null;
			//if (!availablePlugins.Data) availablePlugins.Data = {};
			//availablePlugins.Data[plugin] = data;
			log.debug("Finished installPluginAsync");
		});
};

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
			if (dir.endsWith('/')) {
				dir = dir.substr(0, dir.length - 1);
			}
			if (dir.endsWith('/node_modules')) {
				dir = dir + '/..';
			} else if (!modulesOptional) {
				return false;
			}
			resolve(dir);
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
		if (checkDir(__dirname + "/../..", true)) {

		} else {
			reject(new Error("Unable to determine install path"));
		}

		var pkgDir = path.resolve(__dirname + "/../..");
		if (pkgDir.endsWith('/node_modules')) pkgDir += "/..";

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
		.then(function (modules) {
			var rtn = {
				Type: 1,
				InstalledModules: modules
			};
			var installedPlugins = loadPlugins().Plugins;
			if (installedPlugins) {
				for (var i = 0; i < installedPlugins.length; i++) {
					var p = installedPlugins[i];
					if (p.Name == plugin) {
						rtn.Plugin = p;
						break;
					}
				}
			}
			return rtn;
		});
};
