/**
 * Created by kraigm on 2/13/16.
 */
var nos = require('os');

var OSType = {
	Unknown: null,
	Mac: 1,
	Linux: 2,
	Windows: 3
};

var type = OSType.Unknown;
var plat = OSType.Unknown;

switch (nos.type()) {
	case 'Darwin':
		type = OSType.Mac;
		break;
	case 'Linux':
		type = OSType.Linux;
		break;
	case 'Windows_NT':
		type = OSType.Windows;
		break;
}

switch (nos.platform()) {
	case 'darwin':
		plat = OSType.Mac;
		break;
	case 'linux':
		plat = OSType.Linux;
		break;
	case 'win32':
		plat = OSType.Windows;
		break;
}

module.exports = {
	current: {
		Type: plat || type
	},
	OSType: OSType
};
