![image](example/img/logo.jpg)

# VR.cam - WebXR video player

The purpose of this open source web based video player is to allow easy playback of the video content that was created using one of the Vr.cam webcam devices. Check out a quick demo of the player [here](https://vr.cam/video/).

The implementation of the 3d environment rendered by this library was created with the help of the Babylon.js library.

The currently supported devices for playback are:
* VR.cam 01
* VR.cam 02

## Run the player examples

Everything you need to run this player is inside the `example` folder. There you can find 2 html files, each one for a specific use case:
* `localFile.html` - use this example if you are planning to play a pre-recorded static video file
* `webrtcStream.html` - use this example if you are planning to play a live webrtc video from Dolby.io (see https://vr.cam/how-to/ to find out more about working with Dolby.io)

Each of these 2 example files have their functionality defined inside 2 corresponding javascript files:
* `js/locaFile.js` - this file should be already setup and ready to use with a real video URL inside
* `js/webrtcStream.js` - this file needs some configuration before it can run properly, the information needed should be found inside your Dolby.io account

In order for everything to run smoothly you will need to upload this `example` folder to a real web server (should be the case if you plan to run this on your VR headset), or run one locally. Running these files directly in your browser, and not from a webserver, might cause rendering issues on some of the elements of the player (eg: svg icons).

If you plan to run it locally and already have php installed on your system, the easiest solution would be to run the php dev server, from your console, inside this `example` folder, with this command:

```
php -S localhost:8000
```

This should start a basic web server, and you should be able to view it in your computer browser at the following URLs http://localhost:8000/localFile.html and http://localhost:8000/webrtcStream.html.

## Basic player usage and methods

The compiled version of the WebXR video player `vrPlayer.js` is found inside the `build` folder, an additional copy is found inside the `example/js` folder.

To run it, the first step is to include all player dependencies:

```
<!-- babylon.js main library -->
<script type="application/javascript" src="https://cdn.babylonjs.com/babylon.js"></script>
<!-- babylon.js user interface library -->
<script type="application/javascript" src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
<!-- babylon.js file loader library -->
<script type="application/javascript" src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.js"></script>
<!-- WebXR video player library -->
<script type="application/javascript" src="js/vrPlayer.js"></script>
```

And additional dependencies in case of a live stream, eg:

```
<!-- webrtc livestream handling library -->
<script type="application/javascript" src="https://cdn.jsdelivr.net/npm/@millicast/sdk@0.1.20/dist/millicast.umd.min.js"></script>
```

For a basic implementation, you should initialize the player, set your Vr.cam webcam type and specify the video file you want to play.

```
<script>
    let vrPlayerInstance = new Vr.Player();
    vrPlayerInstance.setCameraDevice(Vr.Player.DEVICE_VR_CAM_V2);
    vrPlayerInstance.setVideo('video.mp4');
</script>
```

The code above will create a new player instance inside a canvas element that will fill all your screen. Also the video file you specified if should start playing automatically.

The WebXR video player instance complete set of methods are the following:

* `setCameraDevice(CAMERA_DEVICE_CONSTANT)` - call this to set your video projection type, eg: `Vr.Player.DEVICE_VR_CAM_V1`, `Vr.Player.DEVICE_VR_CAM_V2`
* `setVideo(file.mp4 | videoElementHtmlSelector)` - call this to specify which video the player should use, here you can specify a local file or a remote URL or even a video element html instance (used in the case of a live video stream)
* `enterVr()` - call this to enter an immersive session on your VR headset
* `exitVr()` - call this to exit an immersive session on your VR headset
* `audioMute(boolean)` - call this to mute or unmute your video playback
* `videoPlay(boolean)` - call this to play or pause your video playback
* `isVideoPlaying()` - call this to check if a video is already playing

## Develop and build

The source of the WebXR video player can be found inside the `source/vrPlayer` folder. It was developed using TypeScript, so you need to have it installed on your system as well if you plan to add any changes on it.

To build your changes, you can run the TypeScript client inside the `source` folder, from your console, like this:

```
tsc
```

Or watch for live changes on the source code, like this:

```
tsc -w
```

The `build.sh` script found inside the `source` folder should build your player and also copy it in the `example/js` folder.

## Compatibility

The current version of the player should run properly on all the mainstream vr headsets on the market with or without a controller.

Support for Apple Vision Pro is still in development and should arrive soon.
