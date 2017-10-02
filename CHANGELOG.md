# Release 0.7.0
---------------
### Additions 

+ [[#20]](https://github.com/KraigM/HomeBridgeController/issues/20) **Now you can Fully Install the homebridge server right from the app!**  To start, there are two full installers include in this version.  This is still a little rough and likely has some kinks to work out but that should mainly be on the UI side (the actual install should be solid). This was a lot of work, and I'm pretty proud of it.
	1. **Raspberry Pi SD Card Installer** - This installer currently installs a fresh copy of Raspian (the offical RPi OS) ready for homebridge and HomeBridgeController.  Best part is, you simply plug an SD card into your Mac, choose the options you want for the RPi (like WiFi config), and it will automatically do everything for you.  On your Mac it will:
		- Download the latest Raspbian from raspberrypi.org
		- Format your SD card for you
		- Automatically load various settings from your Mac (like keyboard layout)
		- Build a custom auto installer for RPi and add it to your SD card
		- Auto eject your SD card
		
		Then you just plug the SD card into your RPi, plugin the ethernet (unless you have a WiFi compatible RPi and specified that on the installer), and plugin the power.  After that the RPi will automatically set itself up:
		- First it will apply system level configs
		- Properly unpack the Raspbian (NOOBS) image
		- Auto reboot
		- Install any system updates
		- Install the dependencies needed for homebridge
		- Install NPM (with Node 4.2.4)
		- Install homebridge
		- Install homebridge-controllerlink
		- Setup the homebridge config with the controllerlink plugin
		- Setup an auto-start-on-boot for homebridge
		- And reboot again
		
		The whole process on the RPi can take awhile (especially if its is a less powerful RPi and/or slower SD card).  If done properly, it should not require any human interaction; anywhere from 10 mins to 45 mins it should just show up on the app as a new homebridge server detected!
		
	2. **Mac Installer** This installer will install on the Mac you are running on.  Not only will it install homebridge, homebridge-controllerlink, etc but it will even install the Xcode commandline tools (using an Apple command line installer).  Feedback on the UI side is a little lacking, but if it completes without error and shows up then everything should be good to go. This installer will:
		- Install Xcode command line tools (straight from Apple)
		- Install NPM (with Node 4.2.4)
		- Install homebridge
		- Install homebridge-controller
		- Setup the homebridge config with the controllerlink plugin
		- Setup an auto-start-on-login for homebridge (Launch Agent)
		
		Same as the RPi, as soon as it is complete and started up (automatic), it should show up on the app as a new homebridge server detected!

+ [[#41]](https://github.com/KraigM/HomeBridgeController/issues/41) **Now loads the available plugins right from the app** This plus the some other changes in the app greatly increases the install plugin screen.

+ [[#51]](https://github.com/KraigM/HomeBridgeController/issues/51) **Sidebar now indicates which platforms/accessories are currently enabled/disabled**  The sidebar has been greatly cleaned up.  As part of that, the sidebar will now show a green dot next to the enabled platforms/accessories and a red dot next to the disabled platforms/accessories.

+ [[#48]](https://github.com/KraigM/HomeBridgeController/issues/48) Various UI cleanup.


## Release 0.6.2
- [[#35]](https://github.com/KraigM/HomeBridgeController/issues/35) Fixed issue with parsing hub info from Bonjour when in a country that uses commas for decimals.

- [[#36]](https://github.com/KraigM/HomeBridgeController/issues/36) Fixed issue, when logging full debug info using some versions of node.

## Release 0.6.1
- [[#39]](https://github.com/KraigM/HomeBridgeController/issues/39) [[#40]](https://github.com/KraigM/HomeBridgeController/issues/40) Minor bug fixes


# Release 0.6.0
---------------
### Additions 

+ [[#16]](https://github.com/KraigM/HomeBridgeController/issues/16) **Restart HomeBridge right from the app**  There is a new menu item under "Hub" (with a keyboard shortcut) that allows you to restart homebridge remotely, right from within the app.  You actually do not need to change anything about your startup for the restart functionality to work; it simply runs the same command line that was (ultimately) used to start it the first time.  The only thing that changes is if you started it on a console, it will disconnect from that console and be running in the background.  This cannot start your homebridge if it is currently off, nor does it handle system restarts (more to come in the future).

+ [[#31]](https://github.com/KraigM/HomeBridgeController/issues/31) **Logs Homebridge crashes and Auto Restarts** This means if some plugin has a bug that crashes your homebridge every once in a while, not only will you get the nice logs you need to send them, but you will be back up and running without you having to do anything.

+ [[#34]](https://github.com/KraigM/HomeBridgeController/issues/34) **Now supports switching hubs without restarting the app**  To switch, just close the window (or File > Close).  When you close, it will auto save locally, but not to the server.  This means when you open it back up, it will auto revert to the version on the server, however your changes will still show up in "Revert Document".  Auto saving will now also happen periodically (managed by Apple), but it will only save to the server if you explicitly "Save".

+ [[#27]](https://github.com/KraigM/HomeBridgeController/issues/27) Now if no hubs are found, the user will be given a proper message instead of a blank window.


## Release 0.5.1
- [[#37]](https://github.com/KraigM/HomeBridgeController/issues/37) Fixed issue with access key that seems to happen with new users.

- [[#38]](https://github.com/KraigM/HomeBridgeController/issues/38) Fixed UI issue where add/remove buttons were on top of the platforms/accessories, if you have many platforms/accessories.


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
