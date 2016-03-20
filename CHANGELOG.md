# Release 0.5.0
---------------
### Additions 

+ [[#11]](https://github.com/KraigM/HomeBridgeController/issues/11) **Streams logs from HomeBridge** A new Logs view has been added to the app. Currently, when you open the app, it will load all the logs from that day and display them. From there, it will live stream the logs to the right to the app (even over the _local_ network).  This _will not_ effect you console output, it just also sends them to a live stream (authenticated) as well as to a log file for that day.  Log files are stored in your homebridge user directory (same place as your config) in a _controller/logs_ directory. If for some reason you do not wish to use the logger functionality, you can disable it by adding _"disableLogger": true_ to your config.

+ [[#28]](https://github.com/KraigM/HomeBridgeController/issues/28) Now supports **OAuth authentication** (or other similar authentication styles) from plugins.  Right now, only **[Nest](https://github.com/KraigM/homebridge-nest)** is supported, but any others can now be added (request new ones via GitHub issues).

+ [[#24]](https://github.com/KraigM/HomeBridgeController/issues/24) Better handles long running installs. Instead of throwing up a strange timeout error, it will just continue to wait until it finishes. Better integration to come, but this is good in the meantime.

+ [[#7]](https://github.com/KraigM/HomeBridgeController/issues/7) You can now disable platforms and accessories without losing their configs.  The will be completely removed from HomeKit and will not start at all on HomeBridge.  (Note that you will lose any HomeKit settings for that platform/accessory)

+ [[#30]](https://github.com/KraigM/HomeBridgeController/issues/30) Added the Name of the platform/accessory to the sidebar if there are multiple from the same plugin.




## Release 0.4.1
- [[#25]](https://github.com/KraigM/HomeBridgeController/issues/25) Fixed minor issue with link version check


# Release 0.4.0
---------------
### Additions
+ [[#4]](https://github.com/KraigM/HomeBridgeController/issues/4)	**Versioning of Configs**: Now configs are completely version controlled using OSX's built in versioning. This means you are able to quickly revert to previous versions of your config, view how your config has changed over time, and even copy portions of a previous config to your current config. This was a massive change, especially since the real file exists externally but is versioned locally. Almost all functionality has been integrated, however it will be refined going forward (please submit issues for any related problems or feature requests for further integration)

+ [[#5]](https://github.com/KraigM/HomeBridgeController/issues/5)	Some of the UI and terminology have been updated to be more clear and to better integrate with the versioning changes

+ [[#9]](https://github.com/KraigM/HomeBridgeController/issues/9)	You can now delete platforms and accessories from you config

+ [[#1]](https://github.com/KraigM/HomeBridgeController/issues/1)	Added the ability to search new for plugins by name on the install plugin screen



# Release 0.3.0
---------------
### Additions
+ [[#14]](https://github.com/KraigM/HomeBridgeController/issues/14)	Added the ability to update homebridge itself
+ [[#17]](https://github.com/KraigM/HomeBridgeController/issues/17)	Enhanced Locating/Selecting/Connecting to HomeBridge
+ [[#3]](https://github.com/KraigM/HomeBridgeController/issues/3)	All raw settings views now have enhanced controls including features like syntax highlighting, syntax checking, and more
+ [[#13]](https://github.com/KraigM/HomeBridgeController/issues/13)	Properly includes newly released plugins in available plugins to install
+ [[#2]](https://github.com/KraigM/HomeBridgeController/issues/2)	Installed plugins are filtered from the list of available plugins to be installed
+ [[#15]](https://github.com/KraigM/HomeBridgeController/issues/15)	Now displays the description and link to the homepage of the plugins



# Release 0.2.0
---------------
### Additions
+ Added the ability to update plugins and install new plugins (requires manual homebridge restart atm)
+ Setup application update system (for beta, hopefully it will end up on the Mac App Store)

### Fixes
- Various bug fixes


## Hotfix 0.1.1

- Fixed zero padded hub pins



# Release 0.1.0
---------------
+ Initial release (very much alpha)
