(() => {

	// instantiate the vr player
	let vrPlayerInstance = new Vr.Player();
	// optional device set, defaults to DEVICE_VR_CAM_V2
	vrPlayerInstance.setCameraDevice(Vr.Player.DEVICE_VR_CAM_V2);
	// set the remote video source to the vr player
	vrPlayerInstance.setVideo('https://vr.cam/wp-content/uploads/video/IPS_2024-04-12.12.07.29.2070%20-%20sample.mp4');

	// click handler for the "enter vr" button
	let enterVrButton = document.getElementById('enterVrButton');
	enterVrButton.onclick = () => {
		vrPlayerInstance.enterVr();
	};

})();
