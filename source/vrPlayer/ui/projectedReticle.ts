namespace Vr {

	export namespace Ui {

		export class ProjectedReticle extends Vr.Library.AbstractComponent {

			public reticle: BABYLON.Nullable<BABYLON.Mesh>;
			public reticleMat: BABYLON.StandardMaterial | null;
			public hoveredMesh: BABYLON.AbstractMesh | null;
			public onWindowClick: EventListener | null;

			constructor(playerInstance: Vr.Player) {

				super(playerInstance);

				this.playerInstance = playerInstance;

				this.reticle       = null;
				this.reticleMat    = null;
				this.hoveredMesh   = null;
				this.onWindowClick = null;

			}

			create() {

				if (!this.playerInstance.scene.onPointerOverObservable) {
					this.playerInstance.scene.onPointerOverObservable = new BABYLON.Observable();
				}
				if (!this.playerInstance.scene.onPointerOutObservable) {
					this.playerInstance.scene.onPointerOutObservable = new BABYLON.Observable();
				}
				if (!this.playerInstance.scene.onPointerPickObservable) {
					this.playerInstance.scene.onPointerPickObservable = new BABYLON.Observable();
				}

				const disc = BABYLON.MeshBuilder.CreateDisc("gazeReticle", {
					radius      : 0.02,
					tessellation: 48
				}, this.playerInstance.scene);

				const mat             = new BABYLON.StandardMaterial("gazeReticleMat", this.playerInstance.scene);
				mat.diffuseColor      = new BABYLON.Color3(1, 1, 1);
				mat.emissiveColor     = new BABYLON.Color3(1, 1, 1);
				mat.disableLighting   = true;
				mat.backFaceCulling   = false;
				mat.alpha             = 0.2;
				disc.material         = mat;
				disc.isPickable       = false;
				disc.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(3);
				disc.setEnabled(false);

				this.reticle     = disc;
				this.reticleMat  = mat;
				this.hoveredMesh = null;

				this.playerInstance.scene.onBeforeRenderObservable.add(() => {
					const cam = this.playerInstance.scene.activeCamera || this.playerInstance.camera;
					if (!cam) {
						return;
					}

					const pickRay = cam.getForwardRay(100);
					const pick    = this.playerInstance.scene.pickWithRay(pickRay, (m) => m && m.isPickable && m !== this.reticle);

					if (pick && pick.hit && pick.pickedPoint && pick.pickedMesh) {

						this.reticle!.position.copyFrom(pick.pickedPoint);
						this.reticle!.setEnabled(true);

						let n = null;
						if (typeof pick.getNormal === "function") {
							try {
								n = pick.getNormal(true);
							}
							catch (_) {
								n = null;
							}
						}
						if (n && n.length() > 0.0001) {
							const target = this.reticle!.position.add(n);
							this.reticle!.lookAt(target);
						}
						else {
							const forward = cam.getForwardRay(1).direction;
							this.reticle!.lookAt(this.reticle!.position.add(forward));
						}

						// this.reticleMat.emissiveColor.set(1, 1, 0);

						if (typeof this.playerInstance.scene.simulatePointerMove === "function") {
							this.playerInstance.scene.simulatePointerMove(pick);
						}

						this.hoveredMesh = pick.pickedMesh;

						if (pick.pickedMesh.name == 'videoContainer') {
							this.reticleMat!.alpha = 0;
						}

					}
					else {
						if (this.reticle!.isEnabled()) {
							this.reticle!.setEnabled(false);
						}
						this.reticleMat!.emissiveColor.set(1, 1, 1);
						this.reticleMat!.alpha = 0.2;

						if (typeof this.playerInstance.scene.simulatePointerMove === "function") {
							const empty = new BABYLON.PickingInfo();
							empty.hit   = false;
							this.playerInstance.scene.simulatePointerMove(empty);
						}
						this.hoveredMesh = null;
					}
				});

				window.addEventListener("click", () => this.simulateCenterClick());
			}

			simulateCenterClick() {
				const cam = this.playerInstance.scene.activeCamera || this.playerInstance.camera;
				if (!cam) {
					return;
				}

				const pickRay = cam.getForwardRay(100);
				const pick    = this.playerInstance.scene.pickWithRay(pickRay, (m) => m && m.isPickable && m !== this.reticle);

				if (pick && pick.hit) {
					if (typeof this.playerInstance.scene.simulatePointerDown === "function" && typeof this.playerInstance.scene.simulatePointerUp === "function") {
						this.playerInstance.scene.simulatePointerDown(pick);
						this.playerInstance.scene.simulatePointerUp(pick);
						this.reticle!.scaling.setAll(1.4);
					}
					else if (this.playerInstance.scene.onPointerPickObservable) {
						//@ts-ignore
						this.playerInstance.scene.onPointerPickObservable.notifyObservers({pickInfo: pick});
						this.reticle!.scaling.setAll(1.4);
					}
				}
			}

			enable() {

				if (!Vr.Library.Helpers.isVisionOS()) {
					return;
				}

				if (this.reticle) {
					return;
				}

				this.create();

				this.onWindowClick = () => {
					this.simulateCenterClick();
				};

				window.addEventListener("click", this.onWindowClick);

			}

			disable() {

				if (this.onWindowClick) {
					window.removeEventListener("click", this.onWindowClick);
					this.onWindowClick = null;
				}

				if (this.reticle) {
					this.reticle.dispose();
					this.reticle = null;
				}

				if (this.reticleMat) {
					this.reticleMat.dispose();
					this.reticleMat = null;
				}

				this.hoveredMesh = null;
			}

		}

	}

}
