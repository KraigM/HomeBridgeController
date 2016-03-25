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
	on: emitter.on,
	events: events,
	registerServer: registerServer,
	restartHomeBridge: restartHomeBridge
};

module.exports.api = { };
module.exports.api.restart = function(hb, req, log) {
	setTimeout(restartHomeBridge.bind(null, log), 3);
	return {};
};
