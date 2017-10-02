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
var path = require('path');
var rp = require('request-promise');
var npmview = require('npmview');

function npmviewAsync(module) {
	return new Promise(function(resolve, reject) {
		npmview(module, function (err, version, moduleInfo) {
			if (err) {
				reject(err);
			} else {
				moduleInfo.version = version;
				resolve(moduleInfo);
			}
		});
	});
}



module.exports = {

	/**
	 * @param args.global
	 * @param args.registry
	 * @param args.prefix
	 */
	init: function (args) {
		return Promise.resolve();
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

	search: function(keyword) {
		// Based on : http://stackoverflow.com/a/13657540/3578535
		var req = rp({
			uri: 'https://registry.npmjs.org/-/_view/byKeyword',
			qs: {
				startkey: JSON.stringify([keyword]),
				endkey: JSON.stringify([keyword,{}]),
				group_level: 3
			},
			json: true
		});
		return req
			.then(function (data) {
				return data.rows
					.map(function(result){ return result.key[1]; });
			});
	},

	view: function(packageName, field) {
		return npmviewAsync(packageName)
			.then(function(result){
				return field ? result[field] : result;
			})
			.catch(function(err){
				throw err;
			});
	}
};
