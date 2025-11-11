namespace Vr {

	export namespace Ui {

		export namespace Component {

			export class CloseButton extends Vr.Library.AbstractComponent {

				public container: BABYLON.Mesh;

				private material: BABYLON.GUI.AdvancedDynamicTexture;
				private button: BABYLON.GUI.Button;

				private buttonHoverInstance: Vr.Library.ButtonHover;

				public playerInstance: Vr.Player;

				constructor(playerInstance: Vr.Player, parentElement: BABYLON.Mesh) {

					super(playerInstance);

					this.playerInstance = playerInstance;

					this.container = BABYLON.MeshBuilder.CreatePlane(
						'closeButtonPlane',
						{
							width : 0.4,
							height: 0.4
						},
						this.playerInstance.scene
					);

					this.container.renderingGroupId = 0;

					this.material            = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
					this.button              = BABYLON.GUI.Button.CreateImageOnlyButton('closeButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightGrey'));
					this.button.cornerRadius = 400;

					this.button.alpha     = 1;
					this.button.thickness = 0;

					if (this.button.image) {
						this.button.image.width                     = 0.5;
						this.button.image.height                    = 0.5;
						this.button.image.horizontalAlignment       = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
						this.button.image.verticalAlignment         = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
						this.button.image.detectPointerOnOpaqueOnly = true;
					}

					this.material.addControl(this.button);

					this.container.parent = parentElement;

					this.buttonHoverInstance                      = new Vr.Library.ButtonHover(this.container, this.button, playerInstance);
					this.buttonHoverInstance.icon                 = Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightGrey');
					this.buttonHoverInstance.iconHover            = Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightOn');
					this.buttonHoverInstance.backgroundColor      = '';
					this.buttonHoverInstance.backgroundColorHover = '#333333';

					this.initEventListener();

				}

				private initEventListener() {

					this.button.onPointerEnterObservable.add((eventData: BABYLON.GUI.Control) => {

					});

					this.button.onPointerOutObservable.add((eventData: BABYLON.GUI.Control) => {

					});

					this.button.onPointerUpObservable.add((eventData: BABYLON.GUI.Vector2WithInfo) => {

						if (!this.isActive) {
							return;
						}

						this.playerInstance.exitVr();

					});

				}

				public setVisibility(isVisible: boolean) {

					this.isVisible = isVisible;
					this.container.setEnabled(this.isVisible);
					this.buttonHoverInstance.setVisibility(this.isVisible);

				}

			}
		}

	}

}
