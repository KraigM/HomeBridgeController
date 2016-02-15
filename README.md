# HomeBridgeController [![npm version](https://badge.fury.io/js/homebridge-controllerlink.svg)](https://badge.fury.io/js/homebridge-controllerlink) 
Provides a simplified UI for controlling your [HomeBridge](https://github.com/nfarina/homebridge).  This is still a work in progress but currently it is able to:

- Access you HomeBridge instance from anywhere on you local network (same machine, another machine, RPi, doesn't matter)

- Load your current HomeBridge config

- Provides a simplier UI for modifying the config  _(again, still a work in progress)_

- Upload the updated config back to your HomeBridge  _(right now you have to manually restart HomeBridge however you do now for it to take effect)_

- Install new plugins from npm and update existing ones  _(just like the config updates, right now new installs/updates require manual restart of homebridge to take effect)_

- Install updates to HomeBridge itself


If you guys have any issues or want to request/vote on any feature, feel free to create a GitHub issue (please do in fact, feedback is always much appreciated)


### Installation

1. First [Download the App](https://s3.amazonaws.com/enferra-homebridgecontroller-release/HomeBridgeController/HomeBridgeController.dmg). Eventually, we will attempt to move this to the Mac App Store, but at least until then updates _should_ be available right from the app

2. To interact with your HomeBridge, the controller uses a standard HomeBridge plugin that can be installed like other plugins with:
  `npm install -g homebridge-controllerlink`

3. Add the HomeBridgeControllerLink platform to your current HomeBridge config.json like the sample below
 ```
"platforms": [
		{
			"platform" : "HomeBridgeControllerLink"
		}
	],
```

4. Restart your HomeBridge. If it worked, you should see a little line similar to:

5. Startup the app and you will be prompted with any HomeBridge servers with the plugin that are running local network (local network only).

6. Select the HomeBridge that you want to control and the system will attempt to connect.

7. You will then be prompted for the HomeBridge hub's Pin Code. Use the same pincode located in your homebridge config. This is how the link verifies the controller.  If you change your pin code, the next time you open the app the auth will fail and you will be automatically prompted again. You can also update the pin code at anytime from the application's preferences (shortcut `cmd + ,`).

 


### What I plan to add next:

- Better documentation (installation, setup, how-to, etc)

- Cleanup UI


### After That
I have some ideas beyond that but I leave it to you guys to ask for what you want or suggest more:

- Get it on the Mac App Store

- Apply updates without a manual restart (via automated restart, plugin 2.0, docker, or all the above or others)

- iOS app that is able to preform most, if not all, the same functionality. (this one should be fairly easy, I wrote it cross platform so I only need to add a few things to get it on iOS and even Windows if people want)

- Full installation of HomeBridge via the app

- Dynamically built UI for editing plugin settings. Possibly even making it so plugin developers can define metadata for their own editors as part of their npm package.

(Really it is up to you guys to tell me what you want :smile:)
