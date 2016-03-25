/**
 * Created by kraig on 3/20/16.
 */

const ChildProcess = require('child_process');
const Promise = require('bluebird');

var restartHomeBridge = function(log) {
	log = log || console.log;
	var debugLog = log.debug ? log.debug.bind(log) : log;
	var errorLog = log.error ? log.error.bind(log) : log;

	log('restarting...');

	return Promise.resolve()
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
	restartHomeBridge: restartHomeBridge
};

module.exports.api = { };
module.exports.api.restart = function(hb, req, log) {
	setTimeout(restartHomeBridge.bind(null, log), 3);
	return {};
};
