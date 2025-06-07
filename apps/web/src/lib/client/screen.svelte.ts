export const SM = 1
export const MD = 2
export const LG = 3
export const XL = 4

const thresholds = [
	// lower bound, matching size
	[0, SM],
	[768, MD],
	[1024, LG],
	[1280, XL]
]

export class Screen {
	size = $state(XL)
	supportHover = $state(false)

	constructor() {
		if (typeof window !== 'undefined') {
			for (let i = 0; i < thresholds.length; i++) {
				const [low, size] = thresholds[i]
				const [high] = i < thresholds.length - 1 ? thresholds[i + 1] : []
				const query = window.matchMedia(
					`(${low}px <= width${high ? ` < ${high}px` : ''})`
				)
				const handleChange = ({ matches }: MediaQueryListEvent) => {
					if (matches) {
						this.size = size
					}
				}
				query.addEventListener('change', handleChange)
				if (query.matches) {
					this.size = size
				}
			}

			this.supportHover = window.matchMedia('(any-hover: hover)').matches
		}
	}
}

export const screen = new Screen()
