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
var Promise = require('bluebird');
const EventEmitter = require('events');
require('string.prototype.repeat');

const needsLogTime = !Hub.ensureHubVersion('>=0.3.1');

function Logger() {
	EventEmitter.call(this);
	this.enabled = null;
	this._queue = [];
}
util.inherits(Logger, EventEmitter);

Logger.prototype.setEnabled = function(enabled) {
	enabled = (enabled) ? true : false;
	if (this.enabled != null && enabled == this.enabled) {
		return;
	}

	this.enabled = enabled;

	if (enabled) {
		this.runQueue();
	} else {
		this._queue = null;
	}
};

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
			self.queueLog(wrapMap[k], arguments);
			fn.apply(this, arguments);
		};
	});
	console.__ts__ = true;
};

var copyArgs = Array.prototype.slice;
Logger.prototype.queueLog = function(cfg, args) {
	if (this.enabled == false) return;

	args = copyArgs.call(args);
	var preformattedLog = getLineString(cfg, util.format.apply(this, args));

	if (this.enabled == false) return;

	var lines = this._queue;
	if (lines) lines.push(preformattedLog);
	else this.writeLog(preformattedLog);
};

Logger.prototype.runQueue = function() {
	if (!this._queue) return;

	var self = this;
	var lines = this._queue;
	var sendAll = function() {
		var ln;
		while (ln = lines.shift()) {
			self.writeLog(ln);
		}
	};
	sendAll();
	this._queue = null;
	sendAll();
};

Logger.prototype.writeLog = function(preformattedLog) {
	var log_file = this.getLogFileStream();
	log_file.write(preformattedLog);
	this.emit('log', preformattedLog);
};

Logger.prototype.list = function() {
	var logDir = this.getLogDirectory();
	return Promise.fromCallback(fs.readdir.bind(null, logDir))
		.filter(function(val) {
			return val && path.extname(val) == '.hbclog';
		})
		.then(function(ls) {
			return {
				Type: 1,
				LogList: ls
			};
		});
};

var staticInst;
module.exports = function(){
	if (staticInst) return staticInst;
	var logger = new Logger();
	logger.internalRedirect();
	staticInst = logger;
	return logger;
};
module.exports.Logger = Logger;
