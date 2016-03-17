/**
 * Created by kraigm on 1/13/16.
 */

var chalk = require('chalk');
var strftime = require('strftime');
var Loader = require('./loader');
var Hub = require('./hub');
var fs = require('fs-extra');
var util = require('util');
var path = require('path');
const EventEmitter = require('events');

const needsLogTime = !Hub.ensureHubVersion('0.3.1');

function Logger() {
	EventEmitter.call(this);
}
util.inherits(Logger, EventEmitter);

var cachedLogDirectory = null;
Logger.prototype.getLogDirectory = function() {
	return cachedLogDirectory || (cachedLogDirectory = path.resolve(path.join(Loader.ControllerStorageDirectory(), 'logs')));
};

Logger.prototype.ensureLogDirectory = function() {
	var logsDir = this.getLogDirectory();
	if (!fs.existsSync(logsDir)) fs.mkdirsSync(logsDir);
};

Logger.prototype.getLogFilePath = function() {
	var logsDir = this.getLogDirectory();
	return path.join(logsDir, strftime('%F.hbclog'));
};

Logger.prototype.getLogFileStream = function() {
	var filePath = this.getLogFilePath();
	if (this.curStreamPath && this.curStream && this.curStreamPath == filePath) {
		return this.curStream;
	}

	var isContinue = false;
	if (this.curStream) {
		writeClose(this.curStream, true);
		this.curStream = null;
		isContinue = true;
	}

	this.curStream = fs.createWriteStream(filePath, { 'flags': 'a' });
	this.curStreamPath = filePath;
	writeOpen(this.curStream, isContinue);
	return this.curStream;
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
	var line = '[' + prefix + ']';
	if (needsLogTime || !log || log[0] != '[') {
		line += '[' + strftime('%T') + '] ';
	}
	return chalk.stripColor(line + log + '\n');
};

Logger.prototype.internalRedirect = function () {
	if (console.__ts__) return;

	this.ensureLogDirectory();

	var slice = Array.prototype.slice;

	var wrapMap = {
		log: 'LOG',
		info: 'INF',
		warn: 'WAR',
		error: 'ERR'
	};

	var self = this;

	Object.keys(wrapMap).forEach(function (k) {
		var fn = console[k];
		console[k] = function () {
			var log_file = self.getLogFileStream();
			var args = slice.call(arguments);
			var cfg = wrapMap[k];

			var logLine = getLineString(cfg, util.format.apply(this, arguments));
			log_file.write(logLine);
			self.emit('log', logLine);

			fn.apply(this, args);
		};
	});
	console.__ts__ = true;
};


module.exports = function(){
	var logger = new Logger();
	logger.internalRedirect();
	return logger;
};
module.exports.Logger = Logger;
