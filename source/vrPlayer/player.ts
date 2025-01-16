namespace Vr {

	export class Player {

		static readonly ENGINE_OPTION_ANTIALIASING: boolean            = true;
		static readonly ENGINE_OPTION_PRESERVE_DRAWING_BUFFER: boolean = false;
		static readonly ENGINE_OPTION_STENCIL: boolean                 = true;
		static readonly ENGINE_OPTION_DISABLE_WEBGL_2: boolean         = false;
		static readonly ENGINE_OPTION_XR_COMPATIBLE: boolean           = true;
		static readonly ENGINE_OPTION_ADAPT_TO_DEVICE_RATIO: boolean   = true;

		static readonly ENGINE_CANVAS_ELEMENT_SELECTOR_ID = 'engineRenderCanvas';

		static readonly DEVICE_VR_CAM_V1 = 1;
		static readonly DEVICE_VR_CAM_V2 = 2;

		private renderCanvas: HTMLCanvasElement | null;
		public babylonEngine: BABYLON.Engine;
		public scene: BABYLON.Scene;
		public light: BABYLON.PointLight;
		public camera: BABYLON.FreeCamera;

		public xrHelper: BABYLON.WebXRDefaultExperience | undefined;
		public leftController: BABYLON.WebXRInputSource | undefined;
		public leftMotionController: BABYLON.WebXRAbstractMotionController | undefined;
		public leftMeshController: BABYLON.AbstractMesh | undefined;
		public rightController: BABYLON.WebXRInputSource | undefined;
		public rightMotionController: BABYLON.WebXRAbstractMotionController | undefined;
		public rightMeshController: BABYLON.AbstractMesh | undefined;

		public videoProjection: Vr.VideoProjection.ProjectionManger;
		private uiDraggableHandle: Vr.Ui.DraggableHandle;
		private uiUserPanel: Vr.Ui.UserPanel;

		constructor(videoUrl: string) {

			this.renderCanvas                = document.createElement('canvas');
			this.renderCanvas.id             = Player.ENGINE_CANVAS_ELEMENT_SELECTOR_ID;
			this.renderCanvas.style.display  = 'block';
			this.renderCanvas.style.width    = '100%';
			this.renderCanvas.style.height   = '100%';
			this.renderCanvas.style.top      = '0px';
			this.renderCanvas.style.left     = '0px';
			this.renderCanvas.style.position = 'absolute';
			this.renderCanvas.style.zIndex   = '1';

			document.body.appendChild(this.renderCanvas);

			BABYLON.RenderingManager.MIN_RENDERINGGROUPS = -1;

			this.babylonEngine = new BABYLON.Engine(
				this.renderCanvas,
				Player.ENGINE_OPTION_ANTIALIASING,
				{
					preserveDrawingBuffer      : Player.ENGINE_OPTION_PRESERVE_DRAWING_BUFFER,
					stencil                    : Player.ENGINE_OPTION_STENCIL,
					disableWebGL2Support       : Player.ENGINE_OPTION_DISABLE_WEBGL_2,
					xrCompatible               : Player.ENGINE_OPTION_XR_COMPATIBLE,
				},
				Player.ENGINE_OPTION_ADAPT_TO_DEVICE_RATIO
			);

			this.scene            = new BABYLON.Scene(
				this.babylonEngine,
				{
					useGeometryUniqueIdsMap: true,
					useMaterialMeshMap     : true,
					useClonedMeshMap       : true
				}
			);
			this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

			this.light           = new BABYLON.PointLight(
				"PointLight",
				new BABYLON.Vector3(0, 0, -0.5),
				this.scene
			);

			this.camera = new BABYLON.FreeCamera(
				'camera',
				new BABYLON.Vector3(0, 0, 0),
				this.scene
			);
			this.camera.attachControl(this.renderCanvas, true);
			this.camera.fov  = 1.2;
			this.camera.maxZ = 1000;
			this.camera.minZ = -10;

			this.videoProjection = new Vr.VideoProjection.ProjectionManger(this.scene, this);

			this.uiDraggableHandle = new Vr.Ui.DraggableHandle(this);
			this.uiUserPanel       = new Vr.Ui.UserPanel(this, this.uiDraggableHandle.container);

			this.uiDraggableHandle.container.position.z = 12;
			this.uiDraggableHandle.container.position.y = -4;
			this.uiUserPanel.container.position.y       = 0.4;
			this.uiUserPanel.container.position.z       = 0;

			this.xrHelper = undefined;
			BABYLON.WebXRDefaultExperience.CreateAsync(this.scene, {
				ignoreNativeCameraTransformation: false,
				disableDefaultUI                : true,
				disableTeleportation            : false,
			}).then(
				(xrHelper: BABYLON.WebXRDefaultExperience) => {
					this.xrHelper                  = xrHelper;
					this.xrHelper.pointerSelection = {
						//@ts-ignore
						lookAndPickMode: false
					};

					const featureManager = xrHelper.baseExperience.featuresManager;
					featureManager.enableFeature(BABYLON.WebXRFeatureName.HAND_TRACKING, "latest", {
							xrInput: xrHelper.input,
						},
						true,
						false
					);

					this.createMotionController(xrHelper);

				},
				(error: Error) => {
					//
				}
			);

			this.engineStartLoop();
			this.engineRegisterEvent();

			this.scene.blockMaterialDirtyMechanism = true;

		}

		private engineStartLoop() {
			this.babylonEngine.runRenderLoop(() => {
				this.scene.render();
			});
		}

		private engineRegisterEvent() {
			window.addEventListener('resize', () => {
				this.babylonEngine.resize();
			});
		}

		private createMotionController(xrHelper: BABYLON.WebXRDefaultExperience) {
			xrHelper.input.onControllerAddedObservable.add((controller: BABYLON.WebXRInputSource) => {

				controller.onMotionControllerInitObservable.add((motionController: BABYLON.WebXRAbstractMotionController) => {

					if (motionController.handedness == 'left') {
						this.leftController       = controller;
						this.leftMotionController = motionController;
						this.videoProjection.attachZoomToMotionController(this.leftMotionController);
					}

					if (motionController.handedness == 'right') {
						this.rightController       = controller;
						this.rightMotionController = motionController;
						this.videoProjection.attachZoomToMotionController(this.rightMotionController);
					}

					controller.onMeshLoadedObservable.add((mesh: BABYLON.AbstractMesh) => {
						if (motionController.handedness == 'left') {
							this.leftMeshController = mesh;
						}

						if (motionController.handedness == 'right') {
							this.rightMeshController = mesh;
						}
					});

				});

			});
		}

		public enterVr(): Promise<void> {
			return new Promise((resolve, reject) => {

				if (this.xrHelper) {
					this.xrHelper.baseExperience.enterXRAsync('immersive-vr', 'local').then(
						() => {
							resolve();
						},
						(error: Error) => {
							reject();
						}
					);
				}

			});
		}

		public exitVr(): Promise<void> {
			return new Promise((resolve, reject) => {

				if (this.xrHelper) {
					this.xrHelper.baseExperience.exitXRAsync().then(
						() => {
							resolve();
						},
						(error: Error) => {
							reject();
						}
					);
				}

			});
		}

		public setCameraDevice(deviceName: number) {
			let projectionType = VideoProjection.EProjectionType.VR_CAM_V2;
			switch (deviceName) {
				case Player.DEVICE_VR_CAM_V1:
					projectionType = VideoProjection.EProjectionType.VR_CAM_V1;
					break;

				default:
				//

			}

			this.videoProjection.setCurrentProjectionType(projectionType);
		}

		public setVideo(videoUrl: string) {
			let videoTexture = new BABYLON.VideoTexture('videoTexture', videoUrl, this.scene, false, false);

			this.videoProjection.setVideoTexture(videoTexture);
			this.videoProjection.setVisibility(true);
		}

		public audioMute(mute: boolean) {
			this.videoProjection.audioMute(mute);
		}

		public videoPlay(play: boolean) {
			this.videoProjection.videoPlay(play);
		}

		public isVideoPlaying() {
			return this.videoProjection.isPlaying();
		}

	}

}
