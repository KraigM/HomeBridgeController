var Loader = require('./loader.js');
var Plugin = Loader.Plugin;
var API = Loader.API;
var version = require('./version.js');
var npm = require('npm');
var Promise = require('promise');

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
	Plugin.installed().forEach(function (plugin) {
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

var npmCLI = { };
var npmInitAsync = function (log, next) {
	return new Promise(function(resolve, reject) {
		npm.load(npmCLI, function (err) {
			if (err) {
				reject(err);
				return;
			}
			npm.on('log', log.debug);
			if (next) next(resolve, reject);
			else resolve();
		});
	});
};

var availablePlugins = {
	Known: [
		'homebridge-alarmdotcom',
		'homebridge-applescript',
		'homebridge-assurelink',
		'homebridge-better-http-rgb',
		'homebridge-cmd',
		'homebridge-connectedbytcp',
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
		var pkg = data[k];
		for (var v in pkg) {
			arr.push(pkg[v]);
		}
	}
	return {
		AvailablePlugins: arr
	};
};
var refreshAvailablePluginsAsync = function(log) {
	var startDT;
	return npmInitAsync(log)
		.then(function () {
			startDT = Date.now();
			var task = null;
			availablePlugins.Known.forEach(function (id) {
				var t = new Promise(function (resolve, reject) {
					log.debug("Refreshing " + id);
					npm.commands.view([id], function (err, data) {
						if (err) return reject(err);
						if (!availablePlugins.Data) availablePlugins.Data = {};
						availablePlugins.Data[id] = data;
						resolve();
					});
				});
				task = !task ? t : task.then(function () { return t; });
			});
			return task;
		})
		.then(function () {
			availablePlugins.LastRefresh = startDT;
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

module.exports = {
	loadPlugins: loadPlugins,
	getAvailablePluginsAsync: getAvailablePluginsAsync
};

module.exports.api = { };
module.exports.api.get = loadPlugins;
module.exports.api.getAvailableAsync = getAvailablePluginsAsync;
