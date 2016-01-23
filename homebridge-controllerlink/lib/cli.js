/**
 * Created by kraigm on 12/30/15.
 */

var program = require('commander');
var loadPlugins = require('./plugins');
var config = require('./config.js');
var version = require('./version.js');

'use strict';

module.exports = function () {

	// Redirect all console logs
	var stdout = process.stdout;
	console.log = function (d) {
	};
	var rtn = {
		json: function (val, exitCode) {
			rtn.raw(JSON.stringify(val), exitCode);
		},
		raw: function (val, exitCode) {
			if (exitCode == undefined) exitCode = 0;
			stdout.write(val);
			process.exit(exitCode);
		}
	};

	program
		.version(version());

	program
		.command('loadPlugins')
		.description('Loads plugin metadata')
		.action(function () {
			var plugins = loadPlugins();
			rtn.json(plugins);
		});

	program
		.command('getConfig')
		.description('Returns the current config file')
		.action(function () {
			rtn.json(config.api.get());
		});

	program.parse(process.argv);
};