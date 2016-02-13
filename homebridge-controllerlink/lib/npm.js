/*
 Copyright 2013 Tomas Junnonen

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 This file was heavily influenced by Tomas Junnonen's work on
 npm-check-updates (https://github.com/tjunnone/npm-check-updates/).
 All related work to his project is only found in this file to ensure
 proper credit.

 */

var _ = require('lodash');
var Promise = require('bluebird');
var npmi = Promise.promisify(require('npmi'));
const npmPath = 'npmi/node_modules/npm';
const npmRegistryPath = npmPath + '/node_modules/npm-registry-client';
var npm = Promise.promisifyAll(require(npmPath));
var path = require('path');

var initialized = false;

/**
 * For some reason, Promise.promisifyAll does not work on npm.commands :(
 *   Promise.promisifyAll(npm.commands);
 * So we have to do it manually.
 */
function rawPromisify(obj) {
	_.each(obj, function (method, name) {
		obj[name + 'Async'] = function () {
			var args = [].slice.call(arguments);
			var that = this;
			return new Promise(function (resolve, reject) {
				args.push(function (err, results) {
					if (err) {
						reject(err);
					} else {
						resolve(results);
					}
				});
				return method.apply(that, args);
			});
		};
	});
}

module.exports = {

	/**
	 * @param args.global
	 * @param args.registry
	 * @param args.prefix
	 */
	init: function (args) {

		args = args || {};

		// configure registry
		if (args.registry) {
			npm.config.set('registry', args.registry);
		}

		// use merge to eliminate undefined values
		return npm.loadAsync(_.merge({}, {
				silent: true,
				global: args.global || undefined,
				prefix: args.prefix || undefined
			}))
			.then(function () {
				rawPromisify(npm.commands);
				// Force non "cached" version of client as "cached" version seems to have issues atm
				var RegistryClient = require(npmRegistryPath);
				npm.registry = new RegistryClient(npm.registry.config);
				return initialized = true;
			});
	},

	install: function(id, options, log) {
		if (options && !log && typeof options === 'function') {
			log = options;
			options = {};
		}
		if (!log) log = function() { };

		var msg = "npm version : " + npmi.NPM_VERSION;
		// prints the installed npm version used by npmi
		log.debug(msg);

		var opts = {
			name: id,	// your module name
			version: options.version || 'latest',		// expected version [default: 'latest']
			path: options.path || '.',				// installation path [default: '.']
			forceInstall: false,	// force install if set to true (even if already installed, it will do a reinstall) [default: false]
			npmLoad: {				// npm.load(options, callback): this is the "options" given to npm.load()
				loglevel: 'silent'	// [default: {loglevel: 'silent'}]
			}
		};
		return npmi(opts)
			.catch(function(err){
				var msg;
				if (err.code === npmi.LOAD_ERR) msg = 'npm load error';
				else if (err.code === npmi.INSTALL_ERR) msg = 'npm install error';
				else msg = err.message;
				throw new Error(msg);
			})
			.then(function (didInstall) {
				var installMessage = didInstall ? ' installed successfully in ' : ' already installed in ';
				log(opts.name + '@' + opts.version + installMessage + path.resolve(opts.path));
				return didInstall;
			});
	},

	view: function(packageName, field) {
		if (!initialized) {
			throw new Error('init must be called before using the version manager');
		}

		if (!field) field = '.';

		return npm.commands.viewAsync([ packageName, field, '--json' ], true)
			.catch(function (err) {
				// normalize 404 errors
				throw err.statusCode === 404 ? new Error(404) : err;
			})
			.then(function (response) {

				// rare case where npm view returns an empty response
				// https://github.com/tjunnone/npm-check-updates/issues/162
				if (_.isEmpty(response)) {
					throw new Error(404);
				}

				return _.values(response)[0][field];
			});
	}
};
