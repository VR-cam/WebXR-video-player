(() => {

	// define dolby.io stream parameters
	// see https://vr.cam/how-to/ - Create a Dolby.io section
	const streamName      = ''; // eg: myStreamName
	const streamAccountId = ''; // eg: O7mpNN
	const tokenGenerator  = () => window.millicast.Director.getSubscriber({streamName, streamAccountId});

	// get the video element dom element
	const videoElement = document.getElementById('videoElement');

	// instantiate the stream object
	const millicastStream = new window.millicast.View(streamName, tokenGenerator, videoElement);

	// instantiate the vr player
	const vrPlayerInstance = new Vr.Player();
	// optional device set, defaults to DEVICE_VR_CAM_V2
	vrPlayerInstance.setCameraDevice(Vr.Player.DEVICE_VR_CAM_V2);

	try {
		// get the dolby.io video stream
		millicastStream.connect().then(() => {
			// video should be playing, set it as a source to the vr player
			vrPlayerInstance.setVideo(videoElement);
		});
	}
	catch(e) {
		console.log('Stream connection error:', e)
	}

	// click handler for the "enter vr" button
	let enterVrButton = document.getElementById('enterVrButton');
	enterVrButton.onclick = () => {
		vrPlayerInstance.enterVr();
	};

})();
