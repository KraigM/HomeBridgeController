/**
 * Created by kraig on 3/20/16.
 */

const ChildProcess = require('child_process');

var restartHomeBridge = function(log) {
	log = log || console.log;
	debug = log.debug || log;

	try {
		log('restarting...');

		var args = process.argv.slice();
		var cmd = args.shift();
		log(JSON.stringify(args));
		ChildProcess.spawn(cmd, args, {
			detached: true,
			stdio: 'ignore'
		});
	} catch (err) {
		var errorLog = log.error || log;
		if (errorLog) errorLog('Error restarting homebridge. \n'+(err ? err.stack || err.message || err : err));
	}
	process.exit(0);
};

module.exports = {
	restartHomeBridge: restartHomeBridge
};

module.exports.api = { };
module.exports.api.restart = function(hb, req, log) {
	setTimeout(restartHomeBridge.bind(null, log), 3);
	return {};
};
