/**
 * Created by kraig on 3/6/16.
 */

var npm = require('./npm');

var queue = { };
var completed = { };

var StatusType = {
    Unknown: 0,
    Queued: 1,
    InProgress: 2,
    Success: 3,
    Error: 4
};

var enqueue = function(id, options, log) {
    var stat = queue[id];
    if (stat) return stat;
    stat = {
        status: StatusType.Queued
    };
    queue[id] = stat;
    var installTask = npm.install(id, options, log)
        .then(function(didInstall) {
            stat.didInstall = didInstall;
            stat.status = StatusType.Success;
        })
        .catch(function(err) {
            stat.error = err;
            stat.status = StatusType.Error;
        });
    stat.task = installTask;
    installTask.finally(function(){
        completed[id] = stat;
        delete queue[id];
        stat.task = null;
    });
    return stat;
};

var status = function(id) {
    return queue[id] || completed[id];
};

module.exports = {
    enqueue: enqueue,
    status: status,
    StatusType: StatusType
};

module.exports.api = { };
module.exports.api.getStatus = function (hb, req, log) {
    var statusId = req && req.query && req.query.InstallStatusKey;
    if (!statusId) {
        return {
            Type: 2,
            Message: "You must specify a key that identifies the installation"
        };
    }
    var stat = status(statusId);
    if (!stat || !stat.status) {
        return {
            Type: 2,
            Message: "Failed to find installation",
            FullError: "No status object returned from installq.status"
        };
    }
    if (stat.status == StatusType.Error) {
        return {
            Type: 2,
            Message: "Installation failed",
            FullError: stat.error && (stat.error.stack || stat.error.message || stat.error)
        };
    }
    return {
        Type: 1,
        StatusType: stat.status
    };
};
