namespace Vr {

	export namespace Ui {

		export class UserPanel extends Vr.Library.AbstractComponent {

			public container: BABYLON.Mesh;

			private containerMaterial: BABYLON.GUI.AdvancedDynamicTexture;
			private containerRectangle: BABYLON.GUI.Rectangle;

			public closeButton: Vr.Ui.Component.CloseButton;
			public audioButton: Vr.Ui.Component.AudioButton;
			public playButton: Vr.Ui.Component.PlayButton;

			public playerInstance: Vr.Player;

			constructor(playerInstance: Vr.Player, parentElement: BABYLON.Mesh) {

				super(playerInstance);

				this.playerInstance = playerInstance;

				this.container = BABYLON.MeshBuilder.CreatePlane(
					'userPanelContainer',
					{
						width          : 4,
						height         : 1.5,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					},
					this.playerInstance.scene
				);

				this.container.renderingGroupId = 0;

				this.containerMaterial  = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container, 400, 150);
				this.containerRectangle = new BABYLON.GUI.Rectangle();

				this.closeButton = new Component.CloseButton(this.playerInstance, this.container);
				this.closeButton.container.position.set(1.3, 0.01, -0.1);
				this.closeButton.container.alphaIndex = 10;

				this.audioButton = new Component.AudioButton(this.playerInstance, this.container);
				this.audioButton.container.position.set(-1.3, 0.01, -0.1);
				this.audioButton.container.alphaIndex = 10;

				this.audioButton.setMuted(true);

				this.playButton = new Component.PlayButton(this.playerInstance, this.container);
				this.playButton.container.position.set(0, 0.01, -0.1);
				this.playButton.container.alphaIndex = 10;

				this.containerRectangle.thickness    = 2;
				this.containerRectangle.cornerRadius = 50;
				this.containerRectangle.background   = '#000000';
				this.containerRectangle.color        = '#333333';
				this.containerRectangle.alpha        = 0.5;

				this.containerMaterial.addControl(this.containerRectangle);

				this.container.alphaIndex = 1;

				this.container.parent     = parentElement;
				this.container.isPickable = false;

				this.initEventListener();

			}

			private initEventListener() {

			}

			public setVisibility(isVisible: boolean) {

				this.isVisible = isVisible;
				this.container.setEnabled(this.isVisible);

			}


		}

	}

}
