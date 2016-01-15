/**
 * Created by kraigm on 1/13/16.
 */

var chalk = require('chalk');
var moment = require('moment');
var fs = require('fs');
var util = require('util');

module.exports = function (timeFormat) {
	if (console.__ts__) return;

	var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});

	var format = timeFormat || 'YYYY-MM-DD HH:mm:ss';

	var slice = Array.prototype.slice;

	var wrapMap = {
		log: {
			color:'green',
			print:'[LOG] '
		},
		info: {
			color: 'cyan',
			print:'[INFO]'
		},
		warn: {
			color: 'yellow',
			print:'[WARN]'
		},
		error: {
			color: 'red',
			print:'[ERR] '
		}
	};

	Object.keys(wrapMap).forEach(function (k) {
		var fn = console[k];
		console[k] = function () {
			var args = slice.call(arguments);
			var time = chalk.magenta('['+moment().format(format)+']');
			var cfg = wrapMap[k];
			var type =  chalk[cfg.color](cfg.print);

			log_file.write(time);
			log_file.write(type);
			log_file.write(util.format.apply(this, arguments) + '\n');

			// refer to https://github.com/joyent/node/blob/master/lib/console.js
			//if (k === 'log' || k === 'info') {
			//	process.stdout.write(time);
			//	process.stdout.write(type);
			//} else {
			//	process.stderr.write(time);
			//	process.stderr.write(type);
			//}

			fn.apply(this, args);
		};
	});
	console.__ts__ = true;
};