import '$lib/common'
import '@melodie/ui/src/tests/test-setup'

import { vi } from 'vitest'

Element.prototype.scrollTo = vi.fn()
