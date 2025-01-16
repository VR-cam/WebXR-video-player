namespace Vr {

	export namespace Library {

		export class ButtonHover {

			public isVisible: boolean;
			public isEnabled: boolean;
			public isActive: boolean;

			public playerInstance: Vr.Player;
			public container: BABYLON.Mesh;
			public button: BABYLON.GUI.Button;
			public icon: Optional<string>;
			public iconHover: Optional<string>;
			public iconEnabled: Optional<string>;
			public textColor: Optional<string>;
			public textColorHover: Optional<string>;
			public textColorEnabled: Optional<string>;
			public fontSize: Optional<number>;
			public fontSizeHover: Optional<number>;
			public fontSizeEnabled: Optional<number>;
			public borderColor: Optional<string>;
			public borderColorHover: Optional<string>;
			public borderColorEnabled: Optional<string>;
			public backgroundColor: Optional<string>;
			public backgroundColorHover: Optional<string>;
			public backgroundColorEnabled: Optional<string>;

			constructor(container: BABYLON.Mesh, button: BABYLON.GUI.Button, playerInstance: Vr.Player) {

				this.isVisible = true;
				this.isEnabled = false;
				this.isActive  = true;

				this.playerInstance = playerInstance;
				this.container      = container;
				this.button         = button;

				this.initEventListener();

			}

			public initEventListener() {

				this.button.onPointerEnterObservable.add((eventData: BABYLON.GUI.Control) => {

					if (!this.isActive) {
						return;
					}

					this.renderButtonIconHover();
				});

				this.button.onPointerOutObservable.add((eventData: BABYLON.GUI.Control) => {

					if (!this.isActive) {
						return;
					}

					this.renderButtonIcon();
				});

			}

			public renderButtonIcon() {

				if (this.button.image && typeof this.icon != 'undefined') {
					this.button.image.source = this.icon;

					if (this.isEnabled && typeof this.iconEnabled != 'undefined') {
						this.button.image.source = this.iconEnabled;
					}

				}

				if (this.button.textBlock && typeof this.textColor != 'undefined') {
					this.button.textBlock.color = this.textColor;

					if (this.isEnabled && typeof this.textColorEnabled != 'undefined') {
						this.button.textBlock.color = this.textColorEnabled;
					}

				}

				if (this.button.thickness > 0 && typeof this.borderColor != 'undefined') {
					this.button.color = this.borderColor;

					if (this.isEnabled && typeof this.borderColorEnabled != 'undefined') {
						this.button.color = this.borderColorEnabled;
					}
				}

				if (typeof this.backgroundColor != 'undefined') {
					this.button.background = this.backgroundColor;

					if (this.isEnabled && typeof this.backgroundColorEnabled != 'undefined') {
						this.button.background = this.backgroundColorEnabled;
					}

				}

				if (this.button.textBlock && typeof this.fontSize != 'undefined') {
					this.button.textBlock.fontSize = this.fontSize;

					if (this.isEnabled && typeof this.fontSizeEnabled != 'undefined') {
						this.button.textBlock.fontSize = this.fontSizeEnabled;
					}
				}

			}

			public renderButtonIconHover() {

				if (this.button.image && typeof this.iconHover != 'undefined') {
					this.button.image.source = this.iconHover;
				}

				if (this.button.textBlock && typeof this.textColorHover != 'undefined') {
					this.button.textBlock.color = this.textColorHover;
				}

				if (this.button.thickness > 0 && typeof this.borderColorHover != 'undefined') {
					this.button.color = this.borderColorHover;
				}

				if (typeof this.backgroundColorHover != 'undefined') {
					this.button.background = this.backgroundColorHover;
				}

				if (this.button.textBlock && typeof this.fontSizeHover != 'undefined') {
					this.button.textBlock.fontSize = this.fontSizeHover;
				}

				this.vibrateMotionController();

			}

			public vibrateMotionController() {

				if (this.playerInstance.leftMotionController) {
					this.playerInstance.leftMotionController.pulse(1, 25);
				}

				if (this.playerInstance.rightMotionController) {
					this.playerInstance.rightMotionController.pulse(1, 25);
				}

			}


			public setVisibility(isVisible: boolean) {

				this.isVisible = isVisible;

			}

			public setEnabled(isEnabled: boolean) {

				this.isEnabled = isEnabled;
				this.renderButtonIcon();

			}

			public setActive(isActive: boolean) {

				this.isActive = isActive;

				this.container.isPickable = this.isActive;

			}

		}

	}

}
