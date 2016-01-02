/**
 * Created by kraigm on 1/1/16.
 */

var Path = require('path');
var fs = require('fs');

module.exports = function (path) {
	if (!path) path = Path.join(__dirname, '..');
	var pkgPath = Path.join(path, 'package.json');
	var pkg = JSON.parse(fs.readFileSync(pkgPath));
	return pkg.version;
};