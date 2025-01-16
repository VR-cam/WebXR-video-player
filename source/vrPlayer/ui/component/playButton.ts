namespace Vr {

	export namespace Ui {

		export namespace Component {

			export class PlayButton extends Vr.Library.AbstractComponent {

				public container: BABYLON.Mesh;
				public containerMaterial: BABYLON.StandardMaterial;

				private mainButtonMaterial: BABYLON.GUI.AdvancedDynamicTexture;
				private mainButton: BABYLON.GUI.Button;

				private buttonHoverInstance: Vr.Library.ButtonHover;

				public playerInstance: Vr.Player;

				public isPlaying: boolean;

				constructor(playerInstance: Vr.Player, parentElement: BABYLON.Mesh) {

					super(playerInstance);

					this.playerInstance = playerInstance;

					this.isPlaying = true;

					this.container = BABYLON.MeshBuilder.CreatePlane(
						'playButtonContainer',
						{
							width          : 1.2,
							height         : 1.2,
							sideOrientation: BABYLON.Mesh.DOUBLESIDE,
						},
						this.playerInstance.scene
					);

					this.container.renderingGroupId = 0;

					this.containerMaterial       = new BABYLON.StandardMaterial('playButtonContainerMaterial', this.playerInstance.scene);
					this.containerMaterial.alpha = 0;
					this.container.material      = this.containerMaterial;
					this.container.alphaIndex    = 1;

					this.container.position.set(0, 0, 0);

					this.mainButtonMaterial      = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
					this.mainButton              = BABYLON.GUI.Button.CreateImageOnlyButton('playButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightGrey'));
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

				public setPlay(isPlaying: boolean) {

					this.isPlaying = isPlaying;
					this.renderPlayButtonIcon();

					this.playerInstance.videoPlay(this.isPlaying);

				}

				public togglePlay() {

					this.isPlaying = !this.isPlaying;
					this.setPlay(this.isPlaying);

				}

				private renderPlayButtonIcon() {

					if (this.mainButton.image) {

						if (this.isPlaying) {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightGrey');
						}
						else {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#playButtonLightGrey');
						}

					}

				}

				private renderPlayButtonIconHover() {

					if (this.mainButton.image) {

						if (this.isPlaying) {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightOn');
						}
						else {
							this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#playButtonLightOn');
						}

					}

				}

				private initEventListener() {

					this.mainButton.onPointerEnterObservable.add((eventData: BABYLON.GUI.Control) => {

						this.renderPlayButtonIconHover();

					});

					this.mainButton.onPointerOutObservable.add((eventData: BABYLON.GUI.Control) => {

						this.renderPlayButtonIcon();

					});

					this.mainButton.onPointerClickObservable.add((eventData: BABYLON.GUI.Vector2WithInfo) => {

						if (!this.isActive) {
							return;
						}

						this.togglePlay();
						this.renderPlayButtonIconHover();

					});

				}

			}

		}

	}

}
