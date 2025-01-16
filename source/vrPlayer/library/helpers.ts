namespace Vr {

	export namespace Library {

		export class Helpers {

			public static createSvgIconUrl(svgIcon: string) {
				return 'img/svg/' + svgIcon.replace('#', '?' + (+new Date()) + '#');
			}

		}

	}

}
