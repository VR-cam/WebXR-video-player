namespace Vr {

	export namespace VideoProjection {

		export abstract class AbstractProjection {

			public scene: BABYLON.Scene;

			public isVisible: boolean;

			public container: BABYLON.Mesh;

			public maxZoomIn: number;
			public maxZoomOut: number;
			public zoomStep: number;

			constructor(scene: BABYLON.Scene, videoTexture: BABYLON.VideoTexture, videoMaterial: BABYLON.StandardMaterial) {

				this.scene = scene;

				this.isVisible = true;

				this.container = BABYLON.MeshBuilder.CreatePlane(
					'videoContainer',
					{
						width          : 1,
						height         : 1,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					},
					this.scene
				);

				this.container.position.x = 0;
				this.container.position.y = 0;
				this.container.position.z = 6;

				this.container.isVisible = false;

				this.maxZoomIn  = 0;
				this.maxZoomOut = 50;
				this.zoomStep   = 0.5;

			}

			public abstract setAspectRatio(width: number, height: number): void;

			public abstract setTexture(videoTexture: BABYLON.VideoTexture): void;

			public abstract setMaterial(material: BABYLON.Material): void;

			public abstract setVisibility(isVisible: boolean): void;

			public abstract zoom(): void;

		}

	}

}
