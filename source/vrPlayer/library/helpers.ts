namespace Vr {

	export namespace Library {

		export class Helpers {

			public static createSvgIconUrl(svgIcon: string) {
				return 'img/svg/' + svgIcon.replace('#', '?' + (+new Date()) + '#');
			}

			public static detectApplePlatform() {
				const nav: any     = typeof navigator !== 'undefined' ? navigator : {};
				const ua           = (nav.userAgent || '').toLowerCase();
				const vendor       = (nav.vendor || '').toLowerCase();
				const brands       = nav.userAgentData?.brands?.map((b: any) => {
					b.brand.toLowerCase()
				}) || [];
				const uaPlatformCH = (nav.userAgentData?.platform || '').toLowerCase();
				const platform     = (nav.platform || '').toLowerCase();
				const maxTouch     = Number(nav.maxTouchPoints || 0);

				// Basic tokens
				const isAppleVendor = vendor.includes('apple');
				const isSafariToken = /safari/.test(ua) && !/chrome|crios|chromium|edg|fxios|firefox/.test(ua);
				const isiPadToken   = /ipad/.test(ua);
				const isiPhoneToken = /iphone|ipod/.test(ua);
				const isMacToken    = /macintosh/.test(ua) || platform === 'macintel';

				// UA-CH hints (future-proof)
				const chIsVision = uaPlatformCH === 'visionos';
				const chIsMac    = uaPlatformCH === 'macos';
				const chIsIOS    = uaPlatformCH === 'ios';
				const chHints    = {chIsVision, chIsMac, chIsIOS};

				const uaMentionsVision            = /visionos|apple\s*vision/.test(ua);
				const hasAnyTouch                 = ('ontouchstart' in (typeof window !== 'undefined' ? window : {})) || maxTouch > 0;
				const looksLikeDesktopUAButIsIPad = isMacToken && maxTouch > 1 && isAppleVendor;
				const looksLikeIPhone             = isiPhoneToken || (chIsIOS && !isiPadToken);

				const hasWebXR              = typeof nav.xr !== 'undefined';
				const isStandalonePropKnown = typeof (/** @type any */(nav)).standalone !== 'undefined'; // iOS/iPadOS PWAs expose this

				let guess      = 'unknown';
				let confidence = 0.2;

				if (chIsVision || uaMentionsVision) {
					guess      = 'visionOS';
					confidence = 0.95;
				}
				else if (looksLikeIPhone) {
					guess      = 'iOS';
					confidence = 0.9;
				}
				else if (isiPadToken || looksLikeDesktopUAButIsIPad) {
					guess      = 'iPadOS';
					confidence = 0.9;
				}
				else if (isSafariToken && isAppleVendor && (isiPadToken || isMacToken) && !hasAnyTouch) {
					if (chIsMac) {
						guess      = 'macOS';
						confidence = 0.85;
					}
					else {
						guess      = 'visionOS';
						confidence = 0.65;
					}
				}
				else if (isSafariToken && isAppleVendor && isMacToken && !hasAnyTouch) {
					guess      = 'macOS';
					confidence = Math.max(confidence, chIsMac ? 0.9 : 0.7);
				}
				else if (chIsMac) {
					guess      = 'macOS';
					confidence = Math.max(confidence, 0.8);
				}
				else if (chIsIOS) {
					guess      = maxTouch > 1 ? 'iPadOS' : 'iOS';
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
					signals : {
						ua,
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
						isStandalonePropKnown,
						...chHints
					}
				};
			}

			public static isVisionOS() {
				let platform = this.detectApplePlatform();

				return platform.signals.isAppleVendor && platform.signals.hasWebXR;
			}

			public static getRenderingGroupId(defaultRenderingGroupId: number) {

				if (Helpers.isVisionOS()) {
					return 0;
				}

				return defaultRenderingGroupId;

			}

		}

	}

}
