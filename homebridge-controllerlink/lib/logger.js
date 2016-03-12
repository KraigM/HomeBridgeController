/**
 * Created by kraigm on 1/13/16.
 */

var chalk = require('chalk');
var strftime = require('strftime');
var Loader = require('./loader');
var fs = require('fs-extra');
var util = require('util');
var path = require('path');

var cachedLogDirectory = null;
var getLogDirectory = function() {
	return cachedLogDirectory || (cachedLogDirectory = path.resolve(path.join(Loader.ControllerStorageDirectory(), 'logs')));
};

var ensureLogDirectory = function() {
	var logsDir = getLogDirectory();
	if (!fs.existsSync(logsDir)) fs.mkdirsSync(logsDir);
};

var getLogFilePath = function() {
	var logsDir = getLogDirectory();
	return path.join(logsDir, strftime('%F.hbclog'));
};

var curStream = null;
var curStreamPath = null;
var getLogFileStream = function() {
	var filePath = getLogFilePath();
	if (curStreamPath && curStream && curStreamPath == filePath) {
		return curStream;
	}

	var isContinue = false;
	if (curStream) {
		writeClose(curStream, true);
		curStream = null;
		isContinue = true;
	}

	curStream = fs.createWriteStream(filePath, { 'flags': 'a' });
	curStreamPath = filePath;
	writeOpen(curStream, isContinue);
	return curStream;
};

var writeOpen = function(stream, isContinue) {
	stream.write(getBreakString(isContinue ? 'CNT' : 'SRT', isContinue ? "Continued" : "Start of log"));
};

var writeClose = function(stream, isContinue) {
	stream.end(getBreakString(isContinue ? 'TBC' : 'END', isContinue ? "To be continued" : "End of log"));
};

var getBreakString = function(prefix, message, isContinue) {
	var c = isContinue ? '-' : '*';
	var breakline = (c + ' ').repeat(10);
	return getLineString(prefix, '| ' + breakline + ' ' + message + ' ' + breakline + '|');
};

var getLineString = function(prefix, log) {
	return chalk.stripColor('[' + strftime('%T') + '][' + prefix + '] ' + log + '\n');
};

var internalRedirect = function () {
	if (console.__ts__) return;

	ensureLogDirectory();

	var slice = Array.prototype.slice;

	var wrapMap = {
		log: {
			color:'green',
			print:'LOG'
		},
		info: {
			color: 'cyan',
			print:'INF'
		},
		warn: {
			color: 'yellow',
			print:'WAR'
		},
		error: {
			color: 'red',
			print:'ERR'
		}
	};

	Object.keys(wrapMap).forEach(function (k) {
		var fn = console[k];
		console[k] = function () {
			var log_file = getLogFileStream();
			var args = slice.call(arguments);
			var cfg = wrapMap[k];
			//var type = chalk[cfg.color](cfg.print);

			var logLine = getLineString(cfg.print, util.format.apply(this, arguments));
			log_file.write(logLine);

			fn.apply(this, args);
		};
	});
	console.__ts__ = true;
};

module.exports = internalRedirect;
