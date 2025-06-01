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

class Screen {
	size = $state(XL)
	supportHover = $state(false)

	constructor() {
		if (typeof window !== 'undefined') {
			for (let i = 1; i < thresholds.length; i++) {
				const [low, size] = thresholds[i - 1]
				const [high] = thresholds[i]
				const query = window.matchMedia(`(${low}px <= width < ${high}px)`)
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

			if (window.matchMedia('(any-hover: hover)').matches) {
				this.supportHover = true
			}
		}
	}
}

export const screen = new Screen()
