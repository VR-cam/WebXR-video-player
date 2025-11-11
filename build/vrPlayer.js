"use strict";
var Vr;
(function (Vr) {
    class Player {
        constructor(videoUrl) {
            this.renderCanvas = document.createElement('canvas');
            this.renderCanvas.id = Player.ENGINE_CANVAS_ELEMENT_SELECTOR_ID;
            this.renderCanvas.style.display = 'block';
            this.renderCanvas.style.width = '100%';
            this.renderCanvas.style.height = '100%';
            this.renderCanvas.style.top = '0px';
            this.renderCanvas.style.left = '0px';
            this.renderCanvas.style.position = 'absolute';
            this.renderCanvas.style.zIndex = '1';
            document.body.appendChild(this.renderCanvas);
            if (!Vr.Library.Helpers.isVisionOS()) {
                BABYLON.RenderingManager.MIN_RENDERINGGROUPS = -1;
            }
            this.babylonEngine = new BABYLON.Engine(this.renderCanvas, Player.ENGINE_OPTION_ANTIALIASING, {
                preserveDrawingBuffer: Player.ENGINE_OPTION_PRESERVE_DRAWING_BUFFER,
                stencil: Player.ENGINE_OPTION_STENCIL,
                disableWebGL2Support: Player.ENGINE_OPTION_DISABLE_WEBGL_2,
                xrCompatible: Player.ENGINE_OPTION_XR_COMPATIBLE,
            }, Player.ENGINE_OPTION_ADAPT_TO_DEVICE_RATIO);
            this.scene = new BABYLON.Scene(this.babylonEngine, {
                useGeometryUniqueIdsMap: true,
                useMaterialMeshMap: true,
                useClonedMeshMap: true
            });
            this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            this.light = new BABYLON.PointLight("PointLight", new BABYLON.Vector3(0, 0, -0.5), this.scene);
            this.camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, 0), this.scene);
            this.camera.attachControl(this.renderCanvas, true);
            this.camera.fov = 1.2;
            this.camera.maxZ = 1000;
            this.camera.minZ = -10;
            this.videoProjection = new Vr.VideoProjection.ProjectionManger(this.scene, this);
            this.uiDraggableHandle = new Vr.Ui.DraggableHandle(this);
            this.uiUserPanel = new Vr.Ui.UserPanel(this, this.uiDraggableHandle.container);
            this.uiDraggableHandle.container.position.z = 5;
            this.uiDraggableHandle.container.position.y = -2;
            this.uiUserPanel.container.position.y = 0.4;
            this.uiUserPanel.container.position.z = 0;
            this.projectedReticle = new Vr.Ui.ProjectedReticle(this);
            this.xrHelper = undefined;
            BABYLON.WebXRDefaultExperience.CreateAsync(this.scene, {
                ignoreNativeCameraTransformation: false,
                disableDefaultUI: true,
                disableTeleportation: false,
            }).then((xrHelper) => {
                this.xrHelper = xrHelper;
                this.xrHelper.pointerSelection = {
                    //@ts-ignore
                    lookAndPickMode: false
                };
                const featureManager = xrHelper.baseExperience.featuresManager;
                featureManager.enableFeature(BABYLON.WebXRFeatureName.HAND_TRACKING, "latest", {
                    xrInput: xrHelper.input,
                }, true, false);
                this.createMotionController(xrHelper);
                xrHelper.input.onControllerAddedObservable.add((controller) => {
                    var _a, _b;
                    const motionController = controller.motionController;
                    if (!motionController) {
                        return;
                    }
                    const trigger = ((_a = motionController.getComponent) === null || _a === void 0 ? void 0 : _a.call(motionController, 'xr-standard-trigger')) ||
                        ((_b = motionController.getMainComponent) === null || _b === void 0 ? void 0 : _b.call(motionController));
                    if (trigger && trigger.onButtonStateChangedObservable) {
                        trigger.onButtonStateChangedObservable.add((c) => {
                            if (c.pressed) {
                                // this._simulateCenterClick();
                            }
                        });
                    }
                });
            }, (error) => {
                //
            });
            this.engineStartLoop();
            this.engineRegisterEvent();
            this.scene.blockMaterialDirtyMechanism = true;
        }
        engineStartLoop() {
            this.babylonEngine.runRenderLoop(() => {
                this.scene.render();
            });
        }
        engineRegisterEvent() {
            window.addEventListener('resize', () => {
                this.babylonEngine.resize();
            });
        }
        createMotionController(xrHelper) {
            xrHelper.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    if (motionController.handedness == 'left') {
                        this.leftController = controller;
                        this.leftMotionController = motionController;
                        this.videoProjection.attachZoomToMotionController(this.leftMotionController);
                    }
                    if (motionController.handedness == 'right') {
                        this.rightController = controller;
                        this.rightMotionController = motionController;
                        this.videoProjection.attachZoomToMotionController(this.rightMotionController);
                    }
                    controller.onMeshLoadedObservable.add((mesh) => {
                        if (motionController.handedness == 'left') {
                            this.leftMeshController = mesh;
                        }
                        if (motionController.handedness == 'right') {
                            this.rightMeshController = mesh;
                        }
                    });
                });
            });
        }
        enterVr() {
            // Vision OS cannot unmute in a immersive mode unless it was already unmuted before entering
            if (this.uiUserPanel.audioButton.isMuted) {
                this.uiUserPanel.audioButton.setMuted(false);
            }
            return new Promise((resolve, reject) => {
                if (this.xrHelper) {
                    this.xrHelper.baseExperience.enterXRAsync('immersive-vr', 'local').then(() => {
                        this.projectedReticle.enable();
                        resolve();
                    }, (error) => {
                        reject();
                    });
                }
            });
        }
        exitVr() {
            return new Promise((resolve, reject) => {
                if (this.xrHelper) {
                    this.xrHelper.baseExperience.exitXRAsync().then(() => {
                        if (Vr.Library.Helpers.isVisionOS()) {
                            window.location.href = window.location.href;
                        }
                        resolve();
                    }, (error) => {
                        reject();
                    });
                }
            });
        }
        setCameraDevice(deviceName) {
            let projectionType = Vr.VideoProjection.EProjectionType.VR_CAM_V2;
            switch (deviceName) {
                case Player.DEVICE_VR_CAM_V1:
                    projectionType = Vr.VideoProjection.EProjectionType.VR_CAM_V1;
                    break;
                default:
                //
            }
            this.videoProjection.setCurrentProjectionType(projectionType);
        }
        setVideo(videoUrl) {
            let videoTexture = new BABYLON.VideoTexture('videoTexture', videoUrl, this.scene, false, false);
            this.videoProjection.setVideoTexture(videoTexture);
            this.videoProjection.setVisibility(true);
        }
        audioMute(mute) {
            this.videoProjection.audioMute(mute);
        }
        videoPlay(play) {
            this.videoProjection.videoPlay(play);
        }
        isVideoPlaying() {
            return this.videoProjection.isPlaying();
        }
    }
    Player.ENGINE_OPTION_ANTIALIASING = true;
    Player.ENGINE_OPTION_PRESERVE_DRAWING_BUFFER = false;
    Player.ENGINE_OPTION_STENCIL = true;
    Player.ENGINE_OPTION_DISABLE_WEBGL_2 = false;
    Player.ENGINE_OPTION_XR_COMPATIBLE = true;
    Player.ENGINE_OPTION_ADAPT_TO_DEVICE_RATIO = true;
    Player.ENGINE_CANVAS_ELEMENT_SELECTOR_ID = 'engineRenderCanvas';
    Player.DEVICE_VR_CAM_V1 = 1;
    Player.DEVICE_VR_CAM_V2 = 2;
    Vr.Player = Player;
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Library;
    (function (Library) {
        class AbstractComponent {
            constructor(playerInstance, parentElement) {
                this.playerInstance = playerInstance;
                this.isVisible = true;
                this.isEnabled = false;
                this.isActive = true;
            }
            vibrateMotionController() {
                if (this.playerInstance.leftMotionController) {
                    this.playerInstance.leftMotionController.pulse(1, 25);
                }
                if (this.playerInstance.rightMotionController) {
                    this.playerInstance.rightMotionController.pulse(1, 25);
                }
            }
            setVisibility(isVisible) {
                this.isVisible = isVisible;
            }
            setEnabled(isEnabled) {
                this.isEnabled = isEnabled;
            }
            setActive(isActive) {
                this.isActive = isActive;
            }
        }
        Library.AbstractComponent = AbstractComponent;
    })(Library = Vr.Library || (Vr.Library = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Library;
    (function (Library) {
        class ButtonHover {
            constructor(container, button, playerInstance) {
                this.isVisible = true;
                this.isEnabled = false;
                this.isActive = true;
                this.playerInstance = playerInstance;
                this.container = container;
                this.button = button;
                this.initEventListener();
            }
            initEventListener() {
                this.button.onPointerEnterObservable.add((eventData) => {
                    if (!this.isActive) {
                        return;
                    }
                    this.renderButtonIconHover();
                });
                this.button.onPointerOutObservable.add((eventData) => {
                    if (!this.isActive) {
                        return;
                    }
                    this.renderButtonIcon();
                });
            }
            renderButtonIcon() {
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
            renderButtonIconHover() {
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
            vibrateMotionController() {
                if (this.playerInstance.leftMotionController) {
                    this.playerInstance.leftMotionController.pulse(1, 25);
                }
                if (this.playerInstance.rightMotionController) {
                    this.playerInstance.rightMotionController.pulse(1, 25);
                }
            }
            setVisibility(isVisible) {
                this.isVisible = isVisible;
            }
            setEnabled(isEnabled) {
                this.isEnabled = isEnabled;
                this.renderButtonIcon();
            }
            setActive(isActive) {
                this.isActive = isActive;
                this.container.isPickable = this.isActive;
            }
        }
        Library.ButtonHover = ButtonHover;
    })(Library = Vr.Library || (Vr.Library = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Library;
    (function (Library) {
        class Helpers {
            static createSvgIconUrl(svgIcon) {
                return 'img/svg/' + svgIcon.replace('#', '?' + (+new Date()) + '#');
            }
            static detectApplePlatform() {
                var _a, _b, _c;
                const nav = typeof navigator !== 'undefined' ? navigator : {};
                const ua = (nav.userAgent || '').toLowerCase();
                const vendor = (nav.vendor || '').toLowerCase();
                const brands = ((_b = (_a = nav.userAgentData) === null || _a === void 0 ? void 0 : _a.brands) === null || _b === void 0 ? void 0 : _b.map((b) => {
                    b.brand.toLowerCase();
                })) || [];
                const uaPlatformCH = (((_c = nav.userAgentData) === null || _c === void 0 ? void 0 : _c.platform) || '').toLowerCase();
                const platform = (nav.platform || '').toLowerCase();
                const maxTouch = Number(nav.maxTouchPoints || 0);
                // Basic tokens
                const isAppleVendor = vendor.includes('apple');
                const isSafariToken = /safari/.test(ua) && !/chrome|crios|chromium|edg|fxios|firefox/.test(ua);
                const isiPadToken = /ipad/.test(ua);
                const isiPhoneToken = /iphone|ipod/.test(ua);
                const isMacToken = /macintosh/.test(ua) || platform === 'macintel';
                // UA-CH hints (future-proof)
                const chIsVision = uaPlatformCH === 'visionos';
                const chIsMac = uaPlatformCH === 'macos';
                const chIsIOS = uaPlatformCH === 'ios';
                const chHints = { chIsVision, chIsMac, chIsIOS };
                const uaMentionsVision = /visionos|apple\s*vision/.test(ua);
                const hasAnyTouch = ('ontouchstart' in (typeof window !== 'undefined' ? window : {})) || maxTouch > 0;
                const looksLikeDesktopUAButIsIPad = isMacToken && maxTouch > 1 && isAppleVendor;
                const looksLikeIPhone = isiPhoneToken || (chIsIOS && !isiPadToken);
                const hasWebXR = typeof nav.xr !== 'undefined';
                const isStandalonePropKnown = typeof ( /** @type any */(nav)).standalone !== 'undefined'; // iOS/iPadOS PWAs expose this
                let guess = 'unknown';
                let confidence = 0.2;
                if (chIsVision || uaMentionsVision) {
                    guess = 'visionOS';
                    confidence = 0.95;
                }
                else if (looksLikeIPhone) {
                    guess = 'iOS';
                    confidence = 0.9;
                }
                else if (isiPadToken || looksLikeDesktopUAButIsIPad) {
                    guess = 'iPadOS';
                    confidence = 0.9;
                }
                else if (isSafariToken && isAppleVendor && (isiPadToken || isMacToken) && !hasAnyTouch) {
                    if (chIsMac) {
                        guess = 'macOS';
                        confidence = 0.85;
                    }
                    else {
                        guess = 'visionOS';
                        confidence = 0.65;
                    }
                }
                else if (isSafariToken && isAppleVendor && isMacToken && !hasAnyTouch) {
                    guess = 'macOS';
                    confidence = Math.max(confidence, chIsMac ? 0.9 : 0.7);
                }
                else if (chIsMac) {
                    guess = 'macOS';
                    confidence = Math.max(confidence, 0.8);
                }
                else if (chIsIOS) {
                    guess = maxTouch > 1 ? 'iPadOS' : 'iOS';
                    confidence = Math.max(confidence, 0.7);
                }
                if (guess === 'visionOS' && hasWebXR) {
                    confidence = Math.min(1, confidence + 0.05);
                }
                if ((guess === 'iOS' || guess === 'iPadOS') && isStandalonePropKnown) {
                    confidence = Math.min(1, confidence + 0.05);
                }
                return {
                    platform: /** @type {'visionOS'|'iPadOS'|'iOS'|'macOS'|'unknown'} */ (guess),
                    confidence,
                    signals: Object.assign({ ua,
                        vendor,
                        brands,
                        uaPlatformCH,
                        isAppleVendor,
                        isSafariToken,
                        isiPadToken,
                        isiPhoneToken,
                        isMacToken,
                        uaMentionsVision,
                        maxTouch,
                        hasAnyTouch,
                        looksLikeDesktopUAButIsIPad,
                        hasWebXR,
                        isStandalonePropKnown }, chHints)
                };
            }
            static isVisionOS() {
                let platform = this.detectApplePlatform();
                return platform.signals.isAppleVendor && platform.signals.hasWebXR;
            }
            static getRenderingGroupId(defaultRenderingGroupId) {
                if (Helpers.isVisionOS()) {
                    return 0;
                }
                return defaultRenderingGroupId;
            }
        }
        Library.Helpers = Helpers;
    })(Library = Vr.Library || (Vr.Library = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        class DraggableHandle extends Vr.Library.AbstractComponent {
            constructor(playerInstance) {
                super(playerInstance);
                this.playerInstance = playerInstance;
                this.container = BABYLON.MeshBuilder.CreatePlane('draggableHandleContainer', {
                    width: 5,
                    height: 1,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                }, this.playerInstance.scene);
                this.material = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
                this.container.position.z = -2;
                this.container.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(2);
                this.rectangleContainer = BABYLON.MeshBuilder.CreatePlane('draggableButtonContainer', {
                    width: 1.5,
                    height: 1.75,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                }, this.playerInstance.scene);
                this.rectangleContainer.position.z = 0;
                this.rectangleContainer.position.y = -0.95;
                this.rectangleContainer.renderingGroupId = 0;
                this.rectangleMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.rectangleContainer);
                this.rectangle = new BABYLON.GUI.Rectangle();
                this.rectangle.verticalAlignment = BABYLON.GUI.Button.VERTICAL_ALIGNMENT_TOP;
                this.rectangle.width = 1;
                this.rectangle.height = 0.06;
                this.rectangle.thickness = 0;
                this.rectangle.cornerRadius = 200;
                this.rectangle.background = '#333333';
                this.rectangle.alpha = 1;
                this.rectangleMaterial.addControl(this.rectangle);
                this.rectangleContainer.parent = this.container;
                this.rectangleContainer.isPickable = false;
                this.buttonContainer = BABYLON.MeshBuilder.CreatePlane('draggableButtonContainer', {
                    width: 1.7,
                    height: 0.2,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                }, this.playerInstance.scene);
                this.buttonContainer.position.z = -0.2;
                this.buttonContainer.position.y = -0.04;
                this.buttonContainer.rotation.x = Math.PI / 8;
                this.buttonMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.buttonContainer);
                this.button = BABYLON.GUI.Button.CreateSimpleButton('containerButton', '');
                this.button.verticalAlignment = BABYLON.GUI.Rectangle.VERTICAL_ALIGNMENT_TOP;
                this.button.width = 1;
                this.button.height = 1;
                this.button.thickness = 0;
                this.button.alpha = 1;
                this.buttonMaterial.addControl(this.button);
                this.buttonContainer.parent = this.container;
                this.dragBehavior = new BABYLON.SixDofDragBehavior();
                this.dragBehavior.rotateDraggedObject = true;
                this.container.addBehavior(this.dragBehavior);
                this.dragBehavior.disableMovement = true;
                this.isCursorOverForced = false;
                this.initEventListener();
            }
            setVisibility(isVisible) {
                this.isVisible = isVisible;
                this.container.setEnabled(this.isVisible);
            }
            initEventListener() {
                this.button.onPointerEnterObservable.add((eventData) => {
                    this.rectangle.background = '#ffffff';
                    if (!this.isCursorOverForced) {
                        this.vibrateMotionController();
                    }
                });
                this.button.onPointerOutObservable.add((eventData) => {
                    if (!this.isCursorOverForced) {
                        this.rectangle.background = '#333333';
                    }
                });
                this.button.onPointerDownObservable.add((eventData) => {
                    this.isCursorOverForced = true;
                    this.dragBehavior.disableMovement = false;
                });
                this.button.onPointerUpObservable.add((eventData) => {
                    if (eventData.x == 0) {
                        this.rectangle.background = '#333333';
                    }
                    this.isCursorOverForced = false;
                    this.dragBehavior.disableMovement = true;
                });
                this.dragBehavior.onDragObservable.add((eventData) => {
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
        Ui.DraggableHandle = DraggableHandle;
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        class ProjectedReticle extends Vr.Library.AbstractComponent {
            constructor(playerInstance) {
                super(playerInstance);
                this.playerInstance = playerInstance;
                this.reticle = null;
                this.reticleMat = null;
                this.hoveredMesh = null;
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
                    radius: 0.02,
                    tessellation: 48
                }, this.playerInstance.scene);
                const mat = new BABYLON.StandardMaterial("gazeReticleMat", this.playerInstance.scene);
                mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
                mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                mat.disableLighting = true;
                mat.backFaceCulling = false;
                mat.alpha = 0.2;
                disc.material = mat;
                disc.isPickable = false;
                disc.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(3);
                disc.setEnabled(false);
                this.reticle = disc;
                this.reticleMat = mat;
                this.hoveredMesh = null;
                this.playerInstance.scene.onBeforeRenderObservable.add(() => {
                    const cam = this.playerInstance.scene.activeCamera || this.playerInstance.camera;
                    if (!cam) {
                        return;
                    }
                    const pickRay = cam.getForwardRay(100);
                    const pick = this.playerInstance.scene.pickWithRay(pickRay, (m) => m && m.isPickable && m !== this.reticle);
                    if (pick && pick.hit && pick.pickedPoint && pick.pickedMesh) {
                        this.reticle.position.copyFrom(pick.pickedPoint);
                        this.reticle.setEnabled(true);
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
                            const target = this.reticle.position.add(n);
                            this.reticle.lookAt(target);
                        }
                        else {
                            const forward = cam.getForwardRay(1).direction;
                            this.reticle.lookAt(this.reticle.position.add(forward));
                        }
                        // this.reticleMat.emissiveColor.set(1, 1, 0);
                        if (typeof this.playerInstance.scene.simulatePointerMove === "function") {
                            this.playerInstance.scene.simulatePointerMove(pick);
                        }
                        this.hoveredMesh = pick.pickedMesh;
                        if (pick.pickedMesh.name == 'videoContainer') {
                            this.reticleMat.alpha = 0;
                        }
                    }
                    else {
                        if (this.reticle.isEnabled()) {
                            this.reticle.setEnabled(false);
                        }
                        this.reticleMat.emissiveColor.set(1, 1, 1);
                        this.reticleMat.alpha = 0.2;
                        if (typeof this.playerInstance.scene.simulatePointerMove === "function") {
                            const empty = new BABYLON.PickingInfo();
                            empty.hit = false;
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
                const pick = this.playerInstance.scene.pickWithRay(pickRay, (m) => m && m.isPickable && m !== this.reticle);
                if (pick && pick.hit) {
                    if (typeof this.playerInstance.scene.simulatePointerDown === "function" && typeof this.playerInstance.scene.simulatePointerUp === "function") {
                        this.playerInstance.scene.simulatePointerDown(pick);
                        this.playerInstance.scene.simulatePointerUp(pick);
                        this.reticle.scaling.setAll(1.4);
                    }
                    else if (this.playerInstance.scene.onPointerPickObservable) {
                        //@ts-ignore
                        this.playerInstance.scene.onPointerPickObservable.notifyObservers({ pickInfo: pick });
                        this.reticle.scaling.setAll(1.4);
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
        Ui.ProjectedReticle = ProjectedReticle;
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        class UserPanel extends Vr.Library.AbstractComponent {
            constructor(playerInstance, parentElement) {
                super(playerInstance);
                this.playerInstance = playerInstance;
                this.container = BABYLON.MeshBuilder.CreatePlane('userPanelContainer', {
                    width: 2,
                    height: 0.75,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                }, this.playerInstance.scene);
                this.container.renderingGroupId = 0;
                this.containerMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container, 400, 150);
                this.containerRectangle = new BABYLON.GUI.Rectangle();
                this.closeButton = new Ui.Component.CloseButton(this.playerInstance, this.container);
                this.closeButton.container.position.set(0.65, 0.02, -0.1);
                this.closeButton.container.alphaIndex = 10;
                this.audioButton = new Ui.Component.AudioButton(this.playerInstance, this.container);
                this.audioButton.container.position.set(-0.65, 0.02, -0.1);
                this.audioButton.container.alphaIndex = 10;
                this.audioButton.setMuted(true);
                this.playButton = new Ui.Component.PlayButton(this.playerInstance, this.container);
                this.playButton.container.position.set(0, 0.04, -0.1);
                this.playButton.container.alphaIndex = 10;
                this.containerRectangle.thickness = 2;
                this.containerRectangle.cornerRadius = 50;
                this.containerRectangle.background = '#000000';
                this.containerRectangle.color = '#333333';
                this.containerRectangle.alpha = 0.5;
                this.containerMaterial.addControl(this.containerRectangle);
                this.container.alphaIndex = 1;
                this.container.parent = parentElement;
                this.container.isPickable = false;
                this.initEventListener();
            }
            initEventListener() {
            }
            setVisibility(isVisible) {
                this.isVisible = isVisible;
                this.container.setEnabled(this.isVisible);
            }
        }
        Ui.UserPanel = UserPanel;
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        let Component;
        (function (Component) {
            class AudioButton extends Vr.Library.AbstractComponent {
                constructor(playerInstance, parentElement) {
                    super(playerInstance);
                    this.playerInstance = playerInstance;
                    this.isMuted = false;
                    this.container = BABYLON.MeshBuilder.CreatePlane('audioButtonContainer', {
                        width: 0.4,
                        height: 0.4,
                        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                    }, this.playerInstance.scene);
                    this.container.renderingGroupId = 0;
                    this.containerMaterial = new BABYLON.StandardMaterial('audioButtonContainerMaterial', this.playerInstance.scene);
                    this.containerMaterial.alpha = 0;
                    this.container.material = this.containerMaterial;
                    this.container.alphaIndex = 1;
                    this.container.position.set(0, 0, 0);
                    this.mainButtonMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
                    this.mainButton = BABYLON.GUI.Button.CreateImageOnlyButton('audioButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightGrey'));
                    this.mainButton.cornerRadius = 400;
                    if (this.mainButton.image) {
                        this.mainButton.image.width = 0.5;
                        this.mainButton.image.height = 0.5;
                        this.mainButton.image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                        this.mainButton.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                        this.mainButton.image.detectPointerOnOpaqueOnly = true;
                    }
                    this.mainButtonMaterial.addControl(this.mainButton);
                    this.container.parent = parentElement;
                    this.buttonHoverInstance = new Vr.Library.ButtonHover(this.container, this.mainButton, playerInstance);
                    this.buttonHoverInstance.backgroundColor = '';
                    this.buttonHoverInstance.backgroundColorHover = '#333333';
                    this.initEventListener();
                }
                setVisibility(isVisible) {
                    this.isVisible = isVisible;
                    this.container.setEnabled(this.isVisible);
                }
                setMuted(isMuted) {
                    this.isMuted = isMuted;
                    this.renderAudioButtonIcon();
                    this.playerInstance.audioMute(this.isMuted);
                }
                toggleMuted() {
                    this.isMuted = !this.isMuted;
                    this.setMuted(this.isMuted);
                }
                renderAudioButtonIcon() {
                    if (this.mainButton.image) {
                        if (this.isMuted) {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOffLightGrey');
                        }
                        else {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightGrey');
                        }
                    }
                }
                renderAudioButtonIconHover() {
                    if (this.mainButton.image) {
                        if (this.isMuted) {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOffLightOn');
                        }
                        else {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#soundOnLightOn');
                        }
                    }
                }
                initEventListener() {
                    this.mainButton.onPointerEnterObservable.add((eventData) => {
                        this.renderAudioButtonIconHover();
                    });
                    this.mainButton.onPointerOutObservable.add((eventData) => {
                        this.renderAudioButtonIcon();
                    });
                    this.mainButton.onPointerClickObservable.add((eventData) => {
                        if (!this.isActive) {
                            return;
                        }
                        this.toggleMuted();
                        this.renderAudioButtonIconHover();
                    });
                }
            }
            Component.AudioButton = AudioButton;
        })(Component = Ui.Component || (Ui.Component = {}));
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        let Component;
        (function (Component) {
            class CloseButton extends Vr.Library.AbstractComponent {
                constructor(playerInstance, parentElement) {
                    super(playerInstance);
                    this.playerInstance = playerInstance;
                    this.container = BABYLON.MeshBuilder.CreatePlane('closeButtonPlane', {
                        width: 0.4,
                        height: 0.4
                    }, this.playerInstance.scene);
                    this.container.renderingGroupId = 0;
                    this.material = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
                    this.button = BABYLON.GUI.Button.CreateImageOnlyButton('closeButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightGrey'));
                    this.button.cornerRadius = 400;
                    this.button.alpha = 1;
                    this.button.thickness = 0;
                    if (this.button.image) {
                        this.button.image.width = 0.5;
                        this.button.image.height = 0.5;
                        this.button.image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                        this.button.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                        this.button.image.detectPointerOnOpaqueOnly = true;
                    }
                    this.material.addControl(this.button);
                    this.container.parent = parentElement;
                    this.buttonHoverInstance = new Vr.Library.ButtonHover(this.container, this.button, playerInstance);
                    this.buttonHoverInstance.icon = Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightGrey');
                    this.buttonHoverInstance.iconHover = Vr.Library.Helpers.createSvgIconUrl('ui.svg#closeLightOn');
                    this.buttonHoverInstance.backgroundColor = '';
                    this.buttonHoverInstance.backgroundColorHover = '#333333';
                    this.initEventListener();
                }
                initEventListener() {
                    this.button.onPointerEnterObservable.add((eventData) => {
                    });
                    this.button.onPointerOutObservable.add((eventData) => {
                    });
                    this.button.onPointerUpObservable.add((eventData) => {
                        if (!this.isActive) {
                            return;
                        }
                        this.playerInstance.exitVr();
                    });
                }
                setVisibility(isVisible) {
                    this.isVisible = isVisible;
                    this.container.setEnabled(this.isVisible);
                    this.buttonHoverInstance.setVisibility(this.isVisible);
                }
            }
            Component.CloseButton = CloseButton;
        })(Component = Ui.Component || (Ui.Component = {}));
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let Ui;
    (function (Ui) {
        let Component;
        (function (Component) {
            class PlayButton extends Vr.Library.AbstractComponent {
                constructor(playerInstance, parentElement) {
                    super(playerInstance);
                    this.playerInstance = playerInstance;
                    this.isPlaying = true;
                    this.container = BABYLON.MeshBuilder.CreatePlane('playButtonContainer', {
                        width: 0.6,
                        height: 0.6,
                        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                    }, this.playerInstance.scene);
                    this.container.renderingGroupId = 0;
                    this.containerMaterial = new BABYLON.StandardMaterial('playButtonContainerMaterial', this.playerInstance.scene);
                    this.containerMaterial.alpha = 0;
                    this.container.material = this.containerMaterial;
                    this.container.alphaIndex = 1;
                    this.container.position.set(0, 0, 0);
                    this.mainButtonMaterial = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.container);
                    this.mainButton = BABYLON.GUI.Button.CreateImageOnlyButton('playButton', Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightGrey'));
                    this.mainButton.cornerRadius = 400;
                    if (this.mainButton.image) {
                        this.mainButton.image.width = 0.5;
                        this.mainButton.image.height = 0.5;
                        this.mainButton.image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                        this.mainButton.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                        this.mainButton.image.detectPointerOnOpaqueOnly = true;
                    }
                    this.mainButtonMaterial.addControl(this.mainButton);
                    this.container.parent = parentElement;
                    this.buttonHoverInstance = new Vr.Library.ButtonHover(this.container, this.mainButton, playerInstance);
                    this.buttonHoverInstance.backgroundColor = '';
                    this.buttonHoverInstance.backgroundColorHover = '#333333';
                    this.initEventListener();
                }
                setVisibility(isVisible) {
                    this.isVisible = isVisible;
                    this.container.setEnabled(this.isVisible);
                }
                setPlay(isPlaying) {
                    this.isPlaying = isPlaying;
                    this.renderPlayButtonIcon();
                    this.playerInstance.videoPlay(this.isPlaying);
                }
                togglePlay() {
                    this.isPlaying = !this.isPlaying;
                    this.setPlay(this.isPlaying);
                }
                renderPlayButtonIcon() {
                    if (this.mainButton.image) {
                        if (this.isPlaying) {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightGrey');
                        }
                        else {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#playButtonLightGrey');
                        }
                    }
                }
                renderPlayButtonIconHover() {
                    if (this.mainButton.image) {
                        if (this.isPlaying) {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#pauseButtonLightOn');
                        }
                        else {
                            this.mainButton.image.source = Vr.Library.Helpers.createSvgIconUrl('ui.svg#playButtonLightOn');
                        }
                    }
                }
                initEventListener() {
                    this.mainButton.onPointerEnterObservable.add((eventData) => {
                        this.renderPlayButtonIconHover();
                    });
                    this.mainButton.onPointerOutObservable.add((eventData) => {
                        this.renderPlayButtonIcon();
                    });
                    this.mainButton.onPointerClickObservable.add((eventData) => {
                        if (!this.isActive) {
                            return;
                        }
                        this.togglePlay();
                        this.renderPlayButtonIconHover();
                    });
                }
            }
            Component.PlayButton = PlayButton;
        })(Component = Ui.Component || (Ui.Component = {}));
    })(Ui = Vr.Ui || (Vr.Ui = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let VideoProjection;
    (function (VideoProjection) {
        class AbstractProjection {
            constructor(scene, videoTexture, videoMaterial) {
                this.scene = scene;
                this.isVisible = true;
                this.container = BABYLON.MeshBuilder.CreatePlane('videoContainer', {
                    width: 1,
                    height: 1,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                }, this.scene);
                this.container.position.x = 0;
                this.container.position.y = 0;
                this.container.position.z = 6;
                this.container.isVisible = false;
                this.maxZoomIn = 0;
                this.maxZoomOut = 50;
                this.zoomStep = 0.5;
            }
        }
        VideoProjection.AbstractProjection = AbstractProjection;
    })(VideoProjection = Vr.VideoProjection || (Vr.VideoProjection = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let VideoProjection;
    (function (VideoProjection) {
        let EProjectionType;
        (function (EProjectionType) {
            EProjectionType[EProjectionType["VR_CAM_V1"] = 0] = "VR_CAM_V1";
            EProjectionType[EProjectionType["VR_CAM_V2"] = 1] = "VR_CAM_V2";
        })(EProjectionType = VideoProjection.EProjectionType || (VideoProjection.EProjectionType = {}));
        class ProjectionManger {
            constructor(scene, playerInstance) {
                this.scene = scene;
                this.videoElementPlaceholder = document.createElement('video');
                this.playerInstance = playerInstance;
                this.videoMaterial = new BABYLON.StandardMaterial('videoMaterial', this.scene);
                this.videoTexture = new BABYLON.VideoTexture('videoTexture', this.videoElementPlaceholder, this.scene, false, false);
                this.videoTexture.level = 1.4;
                this.videoTexture.anisotropicFilteringLevel = 4;
                this.videoTexture.updateSamplingMode(BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE);
                this.videoMaterial.diffuseTexture = this.videoTexture;
                this.videoMaterial.roughness = 1;
                this.videoMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
                this.videoMaterial.disableLighting = true;
                this.videoMaterialPlaceholder = new BABYLON.StandardMaterial('videoMaterial', this.scene);
                this.videoTexturePlaceholder = new BABYLON.VideoTexture('videoTexture', this.videoElementPlaceholder, this.scene, false, false);
                this.videoMaterialPlaceholder.diffuseTexture = this.videoTexturePlaceholder;
                this.currentProjectionType = EProjectionType.VR_CAM_V2;
                this.projectionList = {
                    [EProjectionType.VR_CAM_V1]: new Vr.VideoProjection.Device.VrCamV1(this.scene, this.videoTexture, this.videoMaterial, this.playerInstance),
                    [EProjectionType.VR_CAM_V2]: new Vr.VideoProjection.Device.VrCamV2(this.scene, this.videoTexture, this.videoMaterial, this.playerInstance)
                };
                this.previousPosition = null;
                this.currentPosition = null;
                this.renderVideoTextureToCamera();
            }
            setCurrentProjectionType(projectionType) {
                this.currentProjectionType = projectionType;
            }
            resetVideoTexture() {
                for (let i in this.projectionList) {
                    this.projectionList[i].setTexture(this.videoTexturePlaceholder);
                    this.projectionList[i].setMaterial(this.videoMaterialPlaceholder);
                }
            }
            setVideoTexture(videoTexture) {
                this.videoTexture = videoTexture;
                this.videoMaterial.diffuseTexture = this.videoTexture;
                this.applyVideoTexture();
            }
            applyVideoTexture() {
                this.projectionList[this.currentProjectionType].setTexture(this.videoTexture);
                this.projectionList[this.currentProjectionType].setMaterial(this.videoMaterial);
                for (let i in this.projectionList) {
                    if (this.currentProjectionType != parseInt(i)) {
                        this.projectionList[i].setTexture(this.videoTexturePlaceholder);
                        this.projectionList[i].setMaterial(this.videoMaterialPlaceholder);
                    }
                }
            }
            setVisibility(isVisible) {
                for (let i in this.projectionList) {
                    if (!isVisible) {
                        if (this.projectionList[i].isVisible) {
                            this.projectionList[i].setVisibility(false);
                        }
                        continue;
                    }
                    if (this.currentProjectionType == parseInt(i)) {
                        this.projectionList[i].setVisibility(true);
                    }
                    else {
                        if (this.projectionList[i].isVisible) {
                            this.projectionList[i].setVisibility(false);
                        }
                    }
                }
            }
            setAspectRatio(width, height) {
                for (let i in this.projectionList) {
                    this.projectionList[i].setAspectRatio(width, height);
                }
            }
            zoomIn() {
                for (let i in this.projectionList) {
                    if (this.projectionList[i].container.position.z > this.projectionList[i].maxZoomIn) {
                        this.projectionList[i].container.position.z -= this.projectionList[i].zoomStep;
                        if (this.projectionList[i].zoom != undefined) {
                            this.projectionList[i].zoom();
                        }
                    }
                }
            }
            zoomOut() {
                for (let i in this.projectionList) {
                    if (this.projectionList[i].container.position.z < this.projectionList[i].maxZoomOut) {
                        this.projectionList[i].container.position.z += this.projectionList[i].zoomStep;
                        if (this.projectionList[i].zoom != undefined) {
                            this.projectionList[i].zoom();
                        }
                    }
                }
            }
            getPositionZ() {
                return this.projectionList[this.currentProjectionType].container.position.z;
            }
            setPositionZ(positionZ) {
                for (let i in this.projectionList) {
                    this.projectionList[i].container.position.z = positionZ;
                }
            }
            renderVideoTextureToCamera() {
                this.scene.onBeforeCameraRenderObservable.add((camera) => {
                    this.currentPosition = this.previousPosition;
                    this.previousPosition = camera.position.z;
                    this.currentPosition;
                    switch (this.currentProjectionType) {
                        case EProjectionType.VR_CAM_V1:
                            if (camera.isRightCamera) {
                                this.videoTexture.uOffset = 0.0001;
                            }
                            else {
                                this.videoTexture.uOffset = 0.5;
                            }
                            this.videoTexture.uScale = 0.5;
                            break;
                        case EProjectionType.VR_CAM_V2:
                            if (!camera.isRightCamera) {
                                this.videoTexture.uOffset = 0.0001;
                            }
                            else {
                                this.videoTexture.uOffset = 0.5;
                            }
                            this.videoTexture.uScale = 0.5;
                            break;
                        // show full video
                        default:
                            this.videoTexture.uOffset = 0;
                            this.videoTexture.uScale = 1;
                    }
                });
            }
            attachZoomToMotionController(motionController) {
                let thumbStick = motionController.getComponent('xr-standard-thumbstick');
                if (thumbStick) {
                    thumbStick.onAxisValueChangedObservable.add((position) => {
                        if (position.x != 0) {
                            return;
                        }
                        if (position.y > 0) {
                            this.zoomOut();
                        }
                        if (position.y < 0) {
                            this.zoomIn();
                        }
                    });
                }
            }
            audioMute(mute) {
                this.videoTexture.video.muted = mute;
                // ios fix
                setTimeout(() => {
                    this.videoTexture.video.play();
                }, 200);
            }
            videoPlay(play) {
                if (play) {
                    this.videoTexture.video.play();
                    return;
                }
                this.videoTexture.video.pause();
            }
            isPlaying() {
                return !this.videoTexture.video.paused;
            }
        }
        VideoProjection.ProjectionManger = ProjectionManger;
    })(VideoProjection = Vr.VideoProjection || (Vr.VideoProjection = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let VideoProjection;
    (function (VideoProjection) {
        let Device;
        (function (Device) {
            class VrCamV1 extends VideoProjection.AbstractProjection {
                constructor(scene, videoTexture, videoMaterial, playerInstance) {
                    super(scene, videoTexture, videoMaterial);
                    this.scene = scene;
                    this.videoTexture = videoTexture;
                    this.videoMaterial = videoMaterial;
                    this.videoMaterial.disableLighting = true;
                    this.playerInstance = playerInstance;
                    this.maxZoomIn = 0;
                    this.maxZoomOut = 30;
                    this.zoomStep = 0.25;
                    let pathArray = VrCamV1.createPath();
                    this.ribbon = BABYLON.MeshBuilder.CreateRibbon('videoSphereRibbon', {
                        pathArray: pathArray,
                        closeArray: false,
                        closePath: false,
                        offset: 0,
                        updatable: true,
                        invertUV: true,
                        sideOrientation: BABYLON.Mesh.BACKSIDE,
                    }, this.scene);
                    this.ribbon.material = this.videoMaterial;
                    this.ribbon.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(-1);
                    this.ribbon.position.x = 0;
                    this.ribbon.position.y = 0;
                    this.ribbon.position.z = 3;
                    this.ribbon.rotation.z = Math.PI / 2;
                    this.ribbon.alphaIndex = 0;
                    this.ribbon.parent = this.container;
                    this.ribbon.isPickable = false;
                }
                setAspectRatio(width, height) {
                    this.ribbon.scaling.y = 1;
                    this.ribbon.scaling.x = (height / width) * 1;
                }
                zoom() {
                }
                static createPath() {
                    let pathArray = [];
                    for (var i = -10; i < 10; i++) {
                        pathArray.push(VrCamV1.pathFunction(i));
                    }
                    for (var p = 0; p < pathArray.length; p++) {
                        VrCamV1.updatePath(pathArray[p], p);
                    }
                    return pathArray;
                }
                static pathFunction(k) {
                    var path = [];
                    for (var i = 0; i < 20; i++) {
                        var x = i - 10;
                        var y = k;
                        var z = 0;
                        path.push(new BABYLON.Vector3(x, y, z));
                    }
                    return path;
                }
                static updatePath(path, p) {
                    for (var i = 0; i < path.length; i++) {
                        var x = path[i].x;
                        var y = path[i].y;
                        var z = path[i].z;
                        var c1 = Math.sin(Math.PI / 20 * i) * 3.5;
                        var c2 = Math.sin(Math.PI / 20 * p) * 3.5;
                        z += c1;
                        z += c2;
                        path[i].x = x;
                        path[i].y = y;
                        path[i].z = z;
                    }
                }
                setTexture(videoTexture) {
                    this.videoTexture = videoTexture;
                }
                setMaterial(material) {
                    this.videoMaterial = material;
                    this.ribbon.material = this.videoMaterial;
                }
                setVisibility(isVisible) {
                    this.isVisible = isVisible;
                    this.ribbon.isVisible = this.isVisible;
                }
            }
            Device.VrCamV1 = VrCamV1;
        })(Device = VideoProjection.Device || (VideoProjection.Device = {}));
    })(VideoProjection = Vr.VideoProjection || (Vr.VideoProjection = {}));
})(Vr || (Vr = {}));
var Vr;
(function (Vr) {
    let VideoProjection;
    (function (VideoProjection) {
        let Device;
        (function (Device) {
            class VrCamV2 extends VideoProjection.AbstractProjection {
                constructor(scene, videoTexture, videoMaterial, playerInstance) {
                    super(scene, videoTexture, videoMaterial);
                    this.scene = scene;
                    this.videoTexture = videoTexture;
                    this.videoMaterial = videoMaterial;
                    this.videoMaterial.disableLighting = true;
                    this.playerInstance = playerInstance;
                    this.maxZoomIn = 0;
                    this.maxZoomOut = 30;
                    this.zoomStep = 0.25;
                    let pathArray = VrCamV2.createPath();
                    this.ribbon = BABYLON.MeshBuilder.CreateRibbon('videoSphereRibbon', {
                        pathArray: pathArray,
                        closeArray: false,
                        closePath: false,
                        offset: 0,
                        updatable: true,
                        sideOrientation: BABYLON.Mesh.BACKSIDE,
                    }, this.scene);
                    this.ribbon.rotation.z = Math.PI;
                    this.ribbon.material = this.videoMaterial;
                    this.ribbon.renderingGroupId = Vr.Library.Helpers.getRenderingGroupId(-1);
                    this.ribbon.position.x = 0;
                    this.ribbon.position.y = 0;
                    this.ribbon.position.z = 5;
                    this.ribbon.alphaIndex = -1;
                    this.ribbon.parent = this.container;
                    this.ribbon.isPickable = false;
                }
                setAspectRatio(width, height) {
                    //
                }
                zoom() {
                    let adjustment = 1.8 - (this.container.position.z / 40);
                    let angle = 140 - (this.container.position.z * adjustment);
                    let pathArray = VrCamV2.createPath(angle);
                    this.ribbon = BABYLON.MeshBuilder.CreateRibbon('videoSphereRibbon', {
                        pathArray: pathArray,
                        instance: this.ribbon,
                        closeArray: false,
                        closePath: false,
                        offset: 0,
                        updatable: true,
                        sideOrientation: BABYLON.Mesh.BACKSIDE,
                    }, this.scene);
                }
                static createPath(angle) {
                    let pathArray = [];
                    let vAngle = 140;
                    let hAngle = 140;
                    if (angle) {
                        vAngle = angle;
                        hAngle = angle;
                    }
                    let nb = 50;
                    let nbv = nb;
                    let nbh = nb;
                    let size = 10;
                    for (let v = 0; v <= nbv; v++) {
                        const path = [];
                        for (let h = 0; h <= nbh; h++) {
                            let vstart = (180 - vAngle) / 2;
                            let vg = ((vAngle / nbv) * v + vstart) * Math.PI / 180; // v in gradian
                            let hstart = (180 - hAngle) / 2;
                            let hg = ((hAngle / nbh) * h + hstart) * Math.PI / 180; // h in gradian
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
                            path.push(new BABYLON.Vector3(x, y, z));
                        }
                        pathArray.push(path);
                    }
                    return pathArray;
                }
                setTexture(videoTexture) {
                    this.videoTexture = videoTexture;
                }
                setMaterial(material) {
                    this.videoMaterial = material;
                    this.ribbon.material = this.videoMaterial;
                }
                setVisibility(isVisible) {
                    this.isVisible = isVisible;
                    this.ribbon.isVisible = this.isVisible;
                }
            }
            Device.VrCamV2 = VrCamV2;
        })(Device = VideoProjection.Device || (VideoProjection.Device = {}));
    })(VideoProjection = Vr.VideoProjection || (Vr.VideoProjection = {}));
})(Vr || (Vr = {}));
//# sourceMappingURL=vrPlayer.js.map