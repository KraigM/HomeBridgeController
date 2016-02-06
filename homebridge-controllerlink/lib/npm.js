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
var npm = Promise.promisifyAll(require('npm'));

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
				var RegistryClient = require('npm/node_modules/npm-registry-client');
				npm.registry = new RegistryClient(npm.registry.config);
				return initialized = true;
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
