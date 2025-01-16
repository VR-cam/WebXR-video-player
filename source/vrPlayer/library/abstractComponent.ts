namespace Vr {

	export namespace Library {

		export abstract class AbstractComponent {

			public playerInstance: Vr.Player;
			public isVisible: boolean;

			public isEnabled: boolean;
			public isActive: boolean;

			constructor(playerInstance: Vr.Player, parentElement?: BABYLON.Mesh) {

				this.playerInstance = playerInstance;

				this.isVisible = true;
				this.isEnabled = false;
				this.isActive  = true;

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

			}

			public setActive(isActive: boolean) {

				this.isActive = isActive;

			}


		}

	}


}
