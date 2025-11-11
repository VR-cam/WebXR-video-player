namespace Vr {

	export namespace Ui {

		export class DraggableHandle extends Vr.Library.AbstractComponent {

			public container: BABYLON.Mesh;
			public material: BABYLON.GUI.AdvancedDynamicTexture;

			private rectangleContainer: BABYLON.Mesh;
			private rectangleMaterial: BABYLON.GUI.AdvancedDynamicTexture;
			private rectangle: BABYLON.GUI.Rectangle;

			private buttonContainer: BABYLON.Mesh;
			private buttonMaterial: BABYLON.GUI.AdvancedDynamicTexture;
			private button: BABYLON.GUI.Button;

			public dragBehavior: BABYLON.SixDofDragBehavior;

			public isCursorOverForced: boolean;

			public playerInstance: Vr.Player;

			constructor(playerInstance: Vr.Player) {

				super(playerInstance);

				this.playerInstance = playerInstance;

				this.container            = BABYLON.MeshBuilder.CreatePlane(
					'draggableHandleContainer',
					{
						width          : 5,
						height         : 1,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					},
					this.playerInstance.scene
				);
				this.material             = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
				this.container.position.z = -2;

				this.container.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(2);

				this.rectangleContainer            = BABYLON.MeshBuilder.CreatePlane(
					'draggableButtonContainer',
					{
						width          : 1.5,
						height         : 1.75,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					},
					this.playerInstance.scene
				);
				this.rectangleContainer.position.z = 0;
				this.rectangleContainer.position.y = -0.95;

				this.rectangleContainer.renderingGroupId = 0;

				this.rectangleMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.rectangleContainer);
				this.rectangle         = new BABYLON.GUI.Rectangle();

				this.rectangle.verticalAlignment = BABYLON.GUI.Button.VERTICAL_ALIGNMENT_TOP;

				this.rectangle.width        = 1;
				this.rectangle.height       = 0.06;
				this.rectangle.thickness    = 0;
				this.rectangle.cornerRadius = 200;
				this.rectangle.background   = '#333333';
				this.rectangle.alpha        = 1;

				this.rectangleMaterial.addControl(this.rectangle);

				this.rectangleContainer.parent = this.container;
				this.rectangleContainer.isPickable = false;

				this.buttonContainer            = BABYLON.MeshBuilder.CreatePlane(
					'draggableButtonContainer',
					{
						width          : 1.7,
						height         : 0.2,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					},
					this.playerInstance.scene
				);
				this.buttonContainer.position.z = -0.2;
				this.buttonContainer.position.y = -0.04;
				this.buttonContainer.rotation.x = Math.PI / 8;

				this.buttonMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.buttonContainer);
				this.button         = BABYLON.GUI.Button.CreateSimpleButton('containerButton', '');

				this.button.verticalAlignment = BABYLON.GUI.Rectangle.VERTICAL_ALIGNMENT_TOP;

				this.button.width     = 1;
				this.button.height    = 1;
				this.button.thickness = 0;
				this.button.alpha     = 1;

				this.buttonMaterial.addControl(this.button);

				this.buttonContainer.parent = this.container;

				this.dragBehavior                     = new BABYLON.SixDofDragBehavior();
				this.dragBehavior.rotateDraggedObject = true;
				this.container.addBehavior(this.dragBehavior);
				this.dragBehavior.disableMovement = true;

				this.isCursorOverForced = false;

				this.initEventListener();

			}

			public setVisibility(isVisible: boolean) {

				this.isVisible = isVisible;
				this.container.setEnabled(this.isVisible);

			}

			private initEventListener() {

				this.button.onPointerEnterObservable.add((eventData: BABYLON.GUI.Control) => {

					this.rectangle.background = '#ffffff';

					if (!this.isCursorOverForced) {
						this.vibrateMotionController();
					}

				});

				this.button.onPointerOutObservable.add((eventData: BABYLON.GUI.Control) => {

					if (!this.isCursorOverForced) {
						this.rectangle.background = '#333333';
					}

				});

				this.button.onPointerDownObservable.add((eventData: BABYLON.GUI.Vector2WithInfo) => {

					this.isCursorOverForced           = true;
					this.dragBehavior.disableMovement = false;

				});

				this.button.onPointerUpObservable.add((eventData: BABYLON.GUI.Vector2WithInfo) => {

					if (eventData.x == 0) {
						this.rectangle.background = '#333333';
					}

					this.isCursorOverForced           = false;
					this.dragBehavior.disableMovement = true;

				});

				this.dragBehavior.onDragObservable.add((eventData: any) => {

					/*if (eventData.position.z > 40 && eventData.delta.z > 0) {
						this.isCursorOverForced           = false;
						this.dragBehavior.disableMovement = true;
					}

					if (eventData.position.z < 5 && eventData.delta.z < 0) {
						this.isCursorOverForced           = false;
						this.dragBehavior.disableMovement = true;
					}*/

				});

			}

		}

	}

}
