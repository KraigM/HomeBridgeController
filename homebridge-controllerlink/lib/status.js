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

module.exports = {
	on: emitter.on,
	events: events,
	restartHomeBridge: restartHomeBridge
};

module.exports.api = { };
module.exports.api.restart = function(hb, req, log) {
	setTimeout(restartHomeBridge.bind(null, log), 3);
	return {};
};
