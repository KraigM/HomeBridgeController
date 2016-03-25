/**
 * Created by kraigm on 1/1/16.
 */

var express = require('express');
var mdns = require('mdns');
var plugins = require('./plugins');
var Config = require('./config');
var Auth = require('./auth.js');
var Logger = require('./logger');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var Hub = require('./hub');
var InstallQueue = require('./installq');
var SocketIO = require('socket.io');
var http = require('http');
var Path = require('path');
var Status = require('./status');

var logger = new Logger();

module.exports = Server;

function Server(homebridge, port, accessKey, log, disableLogger) {

	logger.setEnabled(!disableLogger);

	this.homebridge = homebridge;
	this.port = port || 51828;
	this.log = log;
	this.debug = log.debug;
	var auth = new Auth(accessKey);
	this.auth = auth;

	var app = express();
	var server = http.createServer(app);

	app.use(bodyParser.json());

	var jsonRtn = function (func) {
		var self = this;
		return function (req, res) {
			new Promise(function(resolve, reject){
				if (!self.auth.verifyToken(req && req.headers && req.headers.token)) {
					res.status(401);
					reject("Not authorized");
				} else {
					resolve(func.bind(self)(self.homebridge, req, self.log));
				}
			})
				.then(function(rtn){
					if (rtn && !rtn.Type) {
						rtn.Type = 1;
					}
					return rtn;
				})
				.catch(function(err){
					var rtn = {
						Type: 2
					};
					if (err instanceof String) {
						rtn.Message = err;
					} else if (err) {
						rtn.Type = err.Type || rtn.Type;
						rtn.Message = err.message || err.Message;
						rtn.FullError = err.FullError || err.stack;
					}
					return rtn;
				})
				.done(function(rtn){
					res.send(rtn);
				});
		};
	}.bind(this);

	app.get('/plugins', jsonRtn(plugins.api.get));
	app.post('/plugins', jsonRtn(plugins.api.installAsync));
	app.get('/plugins/available', jsonRtn(plugins.api.getAvailableAsync));
	app.get('/config', jsonRtn(Config.api.get));
	app.post('/config', jsonRtn(Config.api.put));
	app.get('/hub', jsonRtn(Hub.api.get));
	app.post('/hub', jsonRtn(Hub.api.installAsync));
	app.get('/install/status', jsonRtn(InstallQueue.api.getStatus));
	app.get('/ping', jsonRtn(function(){ return {}; }));
	app.post('/hub/restart', jsonRtn(Status.api.restart));

	var logRouter = express.Router();
	var staticLogFileServer = express.static(logger.getLogDirectory(), {
		extensions: ['hbclog', 'log']
	});
	logRouter.use('/log/live', function(req,res,next){
		var liveFilename = Path.basename(logger.getLogFilePath());
		req.url = '/log/' + liveFilename;
		logRouter(req,res,next);
	});
	logRouter.use("/log", function(req,res,next){
		staticLogFileServer(req,res,next);
	});
	app.use(logRouter);
	app.get('/log', jsonRtn(logger.list.bind(logger)));

	this.app = app;
	this.server = server;
}

Server.prototype.start = function () {
	this.startAsync();
};
Server.prototype.startAsync = function() {
	var self = this;
	return Promise.all([
		Promise.fromCallback(this.server.listen.bind(this.server, this.port))
			.then(function(){
				Status.registerServer(self.server, self.log);
			})
			.then(function(){
				var numUsers = 0;
				var io = SocketIO(self.server);
				const liveRoom = 'live';

				io.use(function(socket, next) {
					var token = socket && socket.handshake && socket.handshake.query && socket.handshake.query.token;
					if (!self.auth.verifyToken(token)) {
						next(new Error('not authorized'));
					} else {
						next();
					}
				});

				var broadcastLog = function(line) {
					io.to(liveRoom).emit('log', line);
				};
				logger.on('log', broadcastLog);

				io.on('connection', function (socket) {
					self.debug("User connected to logger");
					socket.join(liveRoom);

					// when the user disconnects.. perform this
					socket.on('disconnect', function () {
						self.debug("User disconnected from logger");
						--numUsers;
					});
				});
			}),
		Hub.getHubInfoAsync(this.homebridge, this.log)
	])
		.then(function(results) {
			var port = self.server.address().port;
			self.log("Started HomeBridgeControllerLink on port " + port);

			var info = results[1] || {};
			const key = 'hbctrllink';
			mdns.createAdvertisement(mdns.tcp(key), port, {
				name: info.Name,
				txtRecord: {
					Version: info.Version,
					LinkVersion: info.LinkVersion,
					OS: info.OS,
					Name: info.Name,
					Id: info.Id
				}
			}).start();
			self.debug("Advertised HomeBridgeControllerLink (" + key + ") at port " + port);
		})
		.then(Status.enableAutoRestartOnError);
};

