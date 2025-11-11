namespace Vr {

	export namespace Ui {

		export namespace Component {

			export class AudioButton extends Vr.Library.AbstractComponent {

				public container: BABYLON.Mesh;
				public containerMaterial: BABYLON.StandardMaterial;

				private mainButtonMaterial: BABYLON.GUI.AdvancedDynamicTexture;
				private mainButton: BABYLON.GUI.Button;

				private buttonHoverInstance: Vr.Library.ButtonHover;

				public playerInstance: Vr.Player;

				public isMuted: boolean;

				constructor(playerInstance: Vr.Player, parentElement: BABYLON.Mesh) {

					super(playerInstance);

					this.playerInstance = playerInstance;

					this.isMuted = false;

					this.container = BABYLON.MeshBuilder.CreatePlane(
						'audioButtonContainer',
						{
							width          : 0.4,
							height         : 0.4,
							sideOrientation: BABYLON.Mesh.DOUBLESIDE,
						},
						this.playerInstance.scene
					);

					this.container.renderingGroupId = 0;

					this.containerMaterial       = new BABYLON.StandardMaterial('audioButtonContainerMaterial', this.playerInstance.scene);
					this.containerMaterial.alpha = 0;
					this.container.material      = this.containerMaterial;
					this.container.alphaIndex    = 1;

					this.container.position.set(0, 0, 0);

					this.mainButtonMaterial      = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
					this.mainButton              = BABYLON.GUI.Button.CreateImageOnlyButton('audioButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightGrey'));
					this.mainButton.cornerRadius = 400;

					if (this.mainButton.image) {
						this.mainButton.image.width                     = 0.5;
						this.mainButton.image.height                    = 0.5;
						this.mainButton.image.horizontalAlignment       = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
						this.mainButton.image.verticalAlignment         = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
						this.mainButton.image.detectPointerOnOpaqueOnly = true;
					}

					this.mainButtonMaterial.addControl(this.mainButton);

					this.container.parent = parentElement;

					this.buttonHoverInstance                      = new Vr.Library.ButtonHover(this.container, this.mainButton, playerInstance);
					this.buttonHoverInstance.backgroundColor      = '';
					this.buttonHoverInstance.backgroundColorHover = '#333333';

					this.initEventListener();

				}

				public setVisibility(isVisible: boolean) {

					this.isVisible = isVisible;
					this.container.setEnabled(this.isVisible);

				}

				public setMuted(isMuted: boolean) {

					this.isMuted = isMuted;
					this.renderAudioButtonIcon();

					this.playerInstance.audioMute(this.isMuted);

				}

				public toggleMuted() {

					this.isMuted = !this.isMuted;
					this.setMuted(this.isMuted);

				}

				private renderAudioButtonIcon() {

					if (this.mainButton.image) {

						if (this.isMuted) {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOffLightGrey');
						}
						else {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightGrey');
						}

					}

				}

				private renderAudioButtonIconHover() {

					if (this.mainButton.image) {

						if (this.isMuted) {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOffLightOn');
						}
						else {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightOn');
						}

					}

				}

				private initEventListener() {

					this.mainButton.onPointerEnterObservable.add((eventData: BABYLON.GUI.Control) => {

						this.renderAudioButtonIconHover();

					});

					this.mainButton.onPointerOutObservable.add((eventData: BABYLON.GUI.Control) => {

						this.renderAudioButtonIcon();

					});

					this.mainButton.onPointerClickObservable.add((eventData: BABYLON.GUI.Vector2WithInfo) => {

						if (!this.isActive) {
							return;
						}

						this.toggleMuted();
						this.renderAudioButtonIconHover();

					});

				}

			}

		}

	}

}
