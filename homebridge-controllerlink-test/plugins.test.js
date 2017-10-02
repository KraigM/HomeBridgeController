/**
 * Created by kraigm on 2/6/16.
 */

var _ = require('lodash');
var libDir = '../homebridge-controllerlink/lib';
var plugins = require(libDir + '/plugins');

function ok(expr, msg) {
	if (!expr) throw new Error(msg);
}
function finish(task, done) {
	task
		.then(function(){
			done();
		})
		.catch(function(err) {
			done(err);
		});
}

suite('plugins');

test('#getAvailablePluginsAsync', function(done) {
	var log = console.log;
	log.debug = console.log;
	var task = plugins.getAvailablePluginsAsync(null, null, log)
		.then(function(data){
			log('Data Complete: ' + JSON.stringify(data));
			ok(data && data.AvailablePlugins && data.AvailablePlugins.length > 0, 'No plugins returned');

			function checkHasPlugin(name) {
				var plugin = _.find(data.AvailablePlugins, function(p) { return p.Name == name;});
				ok(plugin, "Couldn't find known plugin '" + name + "'");
			}
			checkHasPlugin('homebridge-controllerlink');
			checkHasPlugin('homebridge-nest');
		});
	finish(task, done);
});

test('#installPluginAsync', function(done) {
	var log = console.log;
	log.debug = console.log;
	var task = plugins.installPluginAsync('homebridge-lono', log)
		.then(function(data){
			//TODO: verify installation
		});
	finish(task, done);
});