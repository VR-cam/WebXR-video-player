namespace Vr {

	export namespace VideoProjection {

		export namespace Device {

			export class VrCamV1 extends AbstractProjection {

				public ribbon: BABYLON.Mesh;
				public videoMaterial: BABYLON.StandardMaterial;
				public videoTexture: BABYLON.VideoTexture;

				public playerInstance: Vr.Player;

				constructor(
					scene: BABYLON.Scene,
					videoTexture: BABYLON.VideoTexture,
					videoMaterial: BABYLON.StandardMaterial,
					playerInstance: Vr.Player
				) {

					super(scene, videoTexture, videoMaterial);

					this.scene                         = scene;
					this.videoTexture                  = videoTexture;
					this.videoMaterial                 = videoMaterial;
					this.videoMaterial.disableLighting = true;

					this.playerInstance = playerInstance;

					this.maxZoomIn  = 0;
					this.maxZoomOut = 30;
					this.zoomStep   = 0.25;

					let pathArray = VrCamV1.createPath();

					this.ribbon = BABYLON.MeshBuilder.CreateRibbon(
						'videoSphereRibbon',
						{
							pathArray      : pathArray,
							closeArray     : false,
							closePath      : false,
							offset         : 0,
							updatable      : true,
							invertUV       : true,
							sideOrientation: BABYLON.Mesh.BACKSIDE,
						},
						this.scene
					);

					this.ribbon.material         = this.videoMaterial;
					this.ribbon.renderingGroupId = -1;

					this.ribbon.position.x = 0;
					this.ribbon.position.y = 0;
					this.ribbon.position.z = 3;

					this.ribbon.rotation.z = Math.PI / 2;

					this.ribbon.alphaIndex = 0;

					this.ribbon.parent     = this.container;
					this.ribbon.isPickable = false;

				}

				public setAspectRatio(width: number, height: number) {

					this.ribbon.scaling.y = 1;
					this.ribbon.scaling.x = (height / width) * 1;

				}

				public zoom() {

				}

				static createPath() {

					let pathArray = [];

					for (var i = -10; i < 10; i++) {
						pathArray.push(VrCamV1.pathFunction(i));
					}

					for (var p = 0; p < pathArray.length; p++) {
						VrCamV1.updatePath(pathArray[p], p);
					}

					return pathArray;

				}

				static pathFunction(k: number) {

					var path = [];
					for (var i = 0; i < 20; i++) {
						var x = i - 10;
						var y = k;
						var z = 0;
						path.push(new BABYLON.Vector3(x, y, z));
					}
					return path;

				}

				static updatePath(path: BABYLON.Vector3[], p: number) {

					for (var i = 0; i < path.length; i++) {
						var x = path[i].x;
						var y = path[i].y;
						var z = path[i].z;

						var c1 = Math.sin(Math.PI / 20 * i) * 3.5;
						var c2 = Math.sin(Math.PI / 20 * p) * 3.5;

						z += c1;
						z += c2;

						path[i].x = x;
						path[i].y = y;
						path[i].z = z;
					}

				}

				public setTexture(videoTexture: BABYLON.VideoTexture) {

					this.videoTexture = videoTexture;

				}

				public setMaterial(material: BABYLON.StandardMaterial) {

					this.videoMaterial   = material;
					this.ribbon.material = this.videoMaterial;

				}

				public setVisibility(isVisible: boolean) {

					this.isVisible        = isVisible;
					this.ribbon.isVisible = this.isVisible;

				}

			}

		}

	}

}
