/**
 * Created by kraig on 3/20/16.
 */

const ChildProcess = require('child_process');
const Promise = require('bluebird');
const EventEmitter = require('events');

var emitter = new EventEmitter();
var events =  {
	Shutdown: "shutdown"
};

var RestartStyle = {
	respawn: 0,
	stopOnly: 1
};
RestartStyle.StopOnly = RestartStyle.stopOnly;
RestartStyle.Stop = RestartStyle.stopOnly;
RestartStyle.stop = RestartStyle.stopOnly;

var configuredRestartStyle = RestartStyle.respawn;
var setRestartStyle = function(style, log) {
	log = log || console.log;
	var warn = log.warn ? log.warn.bind(log) : log;
	if (style && RestartStyle.hasOwnProperty(style)) {
		configuredRestartStyle = RestartStyle[style];
		return;
	}
	for (var s in RestartStyle) {
		if (s == style) {
			configuredRestartStyle = style;
			return;
		}
	}
	warn('Unknown restart style: ' + style);
};

var restartHomeBridge = function(log) {
	log = log || console.log;
	var debugLog = log.debug ? log.debug.bind(log) : log;
	var errorLog = log.error ? log.error.bind(log) : log;

	log('restarting...');

	return Promise.resolve()
		.then(function(){
			log('shutting down...');
			emitter.emit(events.Shutdown);
		})
		.then(function(){
			log('shutting down servers...');
			return shutdownRegisteredServersAsync();
		})
		.catch(function(err){
			errorLog('Issue safely shutting down homebridge. \n'+(err ? err.stack || err.message || err : err));
		})
		.then(function(){
			if (configuredRestartStyle == RestartStyle.stopOnly) {
				log('respawn has been disabled so not starting next hub');
				return;
			}
			log('starting next hub...');
			var args = process.argv.slice();
			var cmd = args.shift();
			debugLog(JSON.stringify(args));
			ChildProcess.spawn(cmd, args, {
				detached: true,
				stdio: 'ignore'
			});
		})
		.catch(function(err){
			errorLog('Error starting next homebridge hub. \n'+(err ? err.stack || err.message || err : err));
		})
		.finally(function(){
			log('waiting for exit...');
			process.exit(0);
		});
};

var isAutoRestartOnErrorEnabled = false;
var enableAutoRestartOnError = function() {
	if (isAutoRestartOnErrorEnabled) return;

	process.on('uncaughtException', function(err) {
		console.error("Unhandled Error Detected : ", err && err.stack ? err.stack : err);
		restartFromErrorIfNeeded();
	});

	process.on('unhandledRejection', function (reason, p) {
		console.error("Unhandled Rejection Detected at: Promise ", p, " reason: ", reason);
		restartFromErrorIfNeeded();
	});

	isAutoRestartOnErrorEnabled = true;
};
var restartFromErrorIfNeeded = function() {
	if (!isAutoRestartOnErrorEnabled) return;
	console.warn("Restarting homebridge due to an error");
	restartHomeBridge();
};

var registeredServers = [];
var registerServer = function(server, log) {
	log = log || console.log;
	var debugLog = log.debug ? log.debug.bind(log) : log;
	// Maintain a hash of all connected sockets
	var sockets = {}, nextSocketId = 0;
	server.on('connection', function (socket) {
		// Add a newly connected socket
		var socketId = nextSocketId++;
		sockets[socketId] = socket;
		debugLog('socket', socketId, 'opened');

		// Remove the socket when it closes
		socket.on('close', function () {
			debugLog('socket', socketId, 'closed');
			delete sockets[socketId];
		});
	});

	server.on('close', function(){
		debugLog('Server closed event!');
		var index = registeredServers.indexOf(server);
		if (index > -1) {
			registeredServers.splice(index, 1);
		}
	});

	server.shutdownAsync = function(){
		return new Promise(function(resolve, reject){
			// Close the server
			server.close(function () {
				log.debug('Server closed!');
				resolve();
			});
			// Destroy all open sockets
			for (var socketId in sockets) {
				log.debug('socket', socketId, 'destroyed');
				sockets[socketId].destroy();
			}
		});
	};

	registeredServers.push(server);
};
var shutdownRegisteredServersAsync = function() {
	return Promise.all(registeredServers.map(function(server) {
		return server && server.shutdownAsync && server.shutdownAsync();
	}));
};

module.exports = {
	enableAutoRestartOnError: enableAutoRestartOnError,
	on: emitter.on,
	events: events,
	RestartStyle: RestartStyle,
	setRestartStyle: setRestartStyle,
	registerServer: registerServer,
	restartHomeBridge: restartHomeBridge
};

module.exports.api = { };
module.exports.api.restart = function(hb, req, log) {
	setTimeout(restartHomeBridge.bind(null, log), 3);
	return {};
};
