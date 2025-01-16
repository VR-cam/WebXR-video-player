namespace Vr {

	export namespace VideoProjection {

		export namespace Device {

			export class VrCamV2 extends AbstractProjection {

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

					let pathArray = VrCamV2.createPath();

					this.ribbon = BABYLON.MeshBuilder.CreateRibbon(
						'videoSphereRibbon',
						{
							pathArray      : pathArray,
							closeArray     : false,
							closePath      : false,
							offset         : 0,
							updatable      : true,
							sideOrientation: BABYLON.Mesh.BACKSIDE,
						},
						this.scene
					);

					this.ribbon.rotation.z = Math.PI;

					this.ribbon.material         = this.videoMaterial;
					this.ribbon.renderingGroupId = -1;

					this.ribbon.position.x = 0;
					this.ribbon.position.y = 0;
					this.ribbon.position.z = 5;

					this.ribbon.alphaIndex = 0;

					this.ribbon.parent     = this.container;
					this.ribbon.isPickable = false;

				}

				public setAspectRatio(width: number, height: number) {
					//
				}

				public zoom() {

					let adjustment = 1.8 - (this.container.position.z / 40);
					let angle      = 140 - (this.container.position.z * adjustment);

					let pathArray = VrCamV2.createPath(angle);

					this.ribbon = BABYLON.MeshBuilder.CreateRibbon(
						'videoSphereRibbon',
						{
							pathArray      : pathArray,
							instance       : this.ribbon,
							closeArray     : false,
							closePath      : false,
							offset         : 0,
							updatable      : true,
							sideOrientation: BABYLON.Mesh.BACKSIDE,
						},
						this.scene
					);

				}

				static createPath(angle?: number) {

					let pathArray = [];

					let vAngle = 140;
					let hAngle = 140;

					if (angle) {
						vAngle = angle;
						hAngle = angle;
					}

					let nb   = 50;
					let nbv  = nb;
					let nbh  = nb;
					let size = 10;

					for (let v = 0; v <= nbv; v++) {
						const path = [];
						for (let h = 0; h <= nbh; h++) {
							let vstart = (180 - vAngle) / 2;
							let vg     = ((vAngle / nbv) * v + vstart) * Math.PI / 180; // v in gradian

							let hstart = (180 - hAngle) / 2;
							let hg     = ((hAngle / nbh) * h + hstart) * Math.PI / 180; // h in gradian

							let x = Math.cos(hg) * Math.sin(vg);
							let y = Math.cos(vg);
							let z = Math.sin(hg) * Math.sin(vg) * 0.3;

							y += -Math.sin(-hg) * 0.2 * ((-nbv / 2 + v) / (nbv / 2)); // distort - and adjust from top to bottom
							x += (-1 + Math.abs(Math.sin((180 / nbv * v) * Math.PI / 180))) * 0.5 * ((-nbh / 2 + h) / (nbh / 2)); // distort - and adjust from top to bottom

							z += (-1 + Math.abs(Math.sin((180 / nbv * v) * Math.PI / 180))) * 0.4;
							z += (-1 + Math.abs(Math.sin((180 / nbh * h) * Math.PI / 180))) * 0.3;

							x *= size;
							y *= size;
							z *= size;

							path.push(new BABYLON.Vector3(x, y, z))
						}

						pathArray.push(path)

					}

					return pathArray;

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
