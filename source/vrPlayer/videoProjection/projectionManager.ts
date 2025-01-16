namespace Vr {

	export namespace VideoProjection {

		export enum EProjectionType {
			VR_CAM_V1,
			VR_CAM_V2
		}

		export class ProjectionManger {

			private scene: BABYLON.Scene;

			private videoMaterial: BABYLON.StandardMaterial;
			private videoTexture: BABYLON.VideoTexture;

			private videoMaterialPlaceholder: BABYLON.StandardMaterial;
			private videoTexturePlaceholder: BABYLON.VideoTexture;
			private videoElementPlaceholder: HTMLVideoElement;

			public currentProjectionType: EProjectionType;
			public projectionList: {
				[key: number]: AbstractProjection
			};

			public playerInstance: Vr.Player;

			private previousPosition: number | null;
			private currentPosition: number | null;

			constructor(scene: BABYLON.Scene, playerInstance: Vr.Player) {

				this.scene                   = scene;
				this.videoElementPlaceholder = document.createElement('video');

				this.playerInstance = playerInstance;

				this.videoMaterial = new BABYLON.StandardMaterial('videoMaterial', this.scene);
				this.videoTexture  = new BABYLON.VideoTexture('videoTexture', this.videoElementPlaceholder, this.scene, false, false);

				this.videoTexture.level                     = 1.4;
				this.videoTexture.anisotropicFilteringLevel = 4;
				this.videoTexture.updateSamplingMode(BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE);

				this.videoMaterial.diffuseTexture  = this.videoTexture;
				this.videoMaterial.roughness       = 1;
				this.videoMaterial.emissiveColor   = new BABYLON.Color3(1, 1, 1);
				this.videoMaterial.disableLighting = true;

				this.videoMaterialPlaceholder = new BABYLON.StandardMaterial('videoMaterial', this.scene);
				this.videoTexturePlaceholder  = new BABYLON.VideoTexture('videoTexture', this.videoElementPlaceholder, this.scene, false, false);

				this.videoMaterialPlaceholder.diffuseTexture = this.videoTexturePlaceholder;

				this.currentProjectionType = EProjectionType.VR_CAM_V2;
				this.projectionList        = {
					[EProjectionType.VR_CAM_V1]: new Vr.VideoProjection.Device.VrCamV1(
						this.scene,
						this.videoTexture,
						this.videoMaterial,
						this.playerInstance
					),
					[EProjectionType.VR_CAM_V2]: new Vr.VideoProjection.Device.VrCamV2(
						this.scene,
						this.videoTexture,
						this.videoMaterial,
						this.playerInstance
					)
				};

				this.previousPosition = null;
				this.currentPosition  = null;

				this.renderVideoTextureToCamera();

			}

			public setCurrentProjectionType(projectionType: EProjectionType) {

				this.currentProjectionType = projectionType;

			}

			public resetVideoTexture() {

				for (let i in this.projectionList) {
					this.projectionList[i].setTexture(this.videoTexturePlaceholder);
					this.projectionList[i].setMaterial(this.videoMaterialPlaceholder);
				}

			}

			public setVideoTexture(videoTexture: BABYLON.VideoTexture) {

				this.videoTexture                 = videoTexture;
				this.videoMaterial.diffuseTexture = this.videoTexture;
				this.applyVideoTexture();

			}

			public applyVideoTexture() {

				this.projectionList[this.currentProjectionType].setTexture(this.videoTexture);
				this.projectionList[this.currentProjectionType].setMaterial(this.videoMaterial);

				for (let i in this.projectionList) {
					if (this.currentProjectionType != parseInt(i)) {
						this.projectionList[i].setTexture(this.videoTexturePlaceholder);
						this.projectionList[i].setMaterial(this.videoMaterialPlaceholder);
					}
				}

			}

			public setVisibility(isVisible: boolean) {

				for (let i in this.projectionList) {

					if (!isVisible) {
						if (this.projectionList[i].isVisible) {
							this.projectionList[i].setVisibility(false);
						}
						continue;
					}

					if (this.currentProjectionType == parseInt(i)) {
						this.projectionList[i].setVisibility(true);
					}
					else {
						if (this.projectionList[i].isVisible) {
							this.projectionList[i].setVisibility(false);
						}
					}

				}

			}

			public setAspectRatio(width: number, height: number) {

				for (let i in this.projectionList) {
					this.projectionList[i].setAspectRatio(width, height);
				}

			}

			public zoomIn() {

				for (let i in this.projectionList) {

					if (this.projectionList[i].container.position.z > this.projectionList[i].maxZoomIn) {
						this.projectionList[i].container.position.z -= this.projectionList[i].zoomStep;

						if (this.projectionList[i].zoom != undefined) {
							this.projectionList[i].zoom!();
						}

					}

				}

			}

			public zoomOut() {

				for (let i in this.projectionList) {

					if (this.projectionList[i].container.position.z < this.projectionList[i].maxZoomOut) {
						this.projectionList[i].container.position.z += this.projectionList[i].zoomStep;

						if (this.projectionList[i].zoom != undefined) {
							this.projectionList[i].zoom!();
						}
					}

				}

			}

			public getPositionZ() {

				return this.projectionList[this.currentProjectionType].container.position.z;

			}

			public setPositionZ(positionZ: number) {

				for (let i in this.projectionList) {
					this.projectionList[i].container.position.z = positionZ;
				}

			}

			private renderVideoTextureToCamera() {

				this.scene.onBeforeCameraRenderObservable.add((camera: BABYLON.Camera) => {

					this.currentPosition  = this.previousPosition;
					this.previousPosition = camera.position.z;

					this.currentPosition;

					switch (this.currentProjectionType) {

						case EProjectionType.VR_CAM_V1:

							if (camera.isRightCamera) {
								this.videoTexture.uOffset = 0.0001;
							}
							else {
								this.videoTexture.uOffset = 0.5;
							}

							this.videoTexture.uScale = 0.5;

							break;
						case EProjectionType.VR_CAM_V2:

							if (!camera.isRightCamera) {
								this.videoTexture.uOffset = 0.0001;
							}
							else {
								this.videoTexture.uOffset = 0.5;
							}

							this.videoTexture.uScale = 0.5;

							break;

						// show full video
						default:

							this.videoTexture.uOffset = 0;
							this.videoTexture.uScale  = 1;

					}

				});

			}

			public attachZoomToMotionController(motionController: BABYLON.WebXRAbstractMotionController) {

				let thumbStick = motionController.getComponent('xr-standard-thumbstick');
				if (thumbStick) {

					thumbStick.onAxisValueChangedObservable.add((position: { x: number, y: number }) => {

						if (position.x != 0) {
							return;
						}

						if (position.y > 0) {
							this.zoomOut();
						}

						if (position.y < 0) {
							this.zoomIn();
						}

					});

				}

			}

			public audioMute(mute: boolean) {
				this.videoTexture.video.muted = mute;
			}

			public videoPlay(play: boolean) {

				if (play) {
					this.videoTexture.video.play();
					return;
				}

				this.videoTexture.video.pause();

			}

			public isPlaying() {

				return !this.videoTexture.video.paused;

			}

		}

	}

}
